import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { fetchAuthSession } from 'aws-amplify/auth';
// Import the AWS credential type for type safety
import type { AwsCredentialIdentity } from "@aws-sdk/types";

// Region and Pool IDs from environment variables
const AWS_REGION = import.meta.env.VITE_REGION;
const COGNITO_IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
const COGNITO_USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID;

// Validate required environment variables
if (!AWS_REGION || !COGNITO_IDENTITY_POOL_ID || !COGNITO_USER_POOL_ID) {
  const missing = [
    !AWS_REGION && "VITE_AWS_REGION",
    !COGNITO_IDENTITY_POOL_ID && "VITE_COGNITO_IDENTITY_POOL_ID",
    !COGNITO_USER_POOL_ID && "VITE_COGNITO_USER_POOL_ID"
  ].filter(Boolean).join(", ");
  console.error(`S3 Service Error: Missing required environment variables: ${missing}`);
  // Throw an error or use default/fallback values if appropriate,
  // but relying on missing env variables will likely cause runtime failures.
  throw new Error(`Missing required environment variables: ${missing}`);
}

const USER_POOL_PROVIDER_ID = `cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

/**
 * An async function that acts as a credential provider.
 * It fetches the latest Amplify session token and uses it to get
 * temporary AWS credentials from the Cognito Identity Pool.
 */
const dynamicCognitoCredentialsProvider = async (): Promise<AwsCredentialIdentity> => {
  console.log("S3 Service: dynamicCognitoCredentialsProvider - Attempting to fetch credentials...");
  try {
    // 1. Fetch the Amplify Auth Session
    const session = await fetchAuthSession({ forceRefresh: false }); // Consider forceRefresh strategy
    const idToken = session.tokens?.idToken?.toString();

    // 2. Check if we got an ID Token
    if (!idToken) {
      console.error("S3 Service: No Cognito ID Token found in session. Cannot authenticate with Identity Pool.");
      // Handle appropriately - throw error if auth is strictly required
      throw new Error("User is not authenticated or session is invalid. Cannot retrieve AWS credentials.");
      // Or, if unauthenticated access via Identity Pool is configured and intended:
      // console.warn("S3 Service: Proceeding without authentication token for Identity Pool.");
      // const unauthProvider = fromCognitoIdentityPool({
      //   clientConfig: { region: AWS_REGION },
      //   identityPoolId: COGNITO_IDENTITY_POOL_ID,
      //   // No logins map provided for unauthenticated role
      // });
      // return unauthProvider();
    }

    // 3. Create the Cognito Identity Pool provider configuration *with the current token*
    const cognitoProviderConfig = {
      clientConfig: { region: AWS_REGION },
      identityPoolId: COGNITO_IDENTITY_POOL_ID,
      logins: { // Provide the freshly fetched token in the 'logins' map
        [USER_POOL_PROVIDER_ID]: idToken
      }
    };

    // 4. Get the actual provider function from the SDK using the dynamic config
    const cognitoProvider = fromCognitoIdentityPool(cognitoProviderConfig);

    // 5. Invoke the provider function to fetch AWS credentials
    console.log("S3 Service: Fetching credentials from Cognito Identity Pool with ID token.");
    const credentials = await cognitoProvider(); // This makes the call to Cognito Identity service
    console.log("S3 Service: Credentials successfully obtained.");
    return credentials;

  } catch (error) {
    console.error("S3 Service: Failed to get credentials via dynamic provider:", error);
    // Re-throw the error to ensure the S3 operation fails clearly
    throw error;
  }
};

// Initialize the S3 client using our custom async function as a credentials provider
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: dynamicCognitoCredentialsProvider
});

// --- Rest of your S3Service functions remain unchanged ---

// Base bucket name
const BUCKET_NAME = "mochi-prod-final-trader-ranking"; // Ensure this is correct

// Function to get a pre-signed URL for an S3 object
export const getS3ImageUrl = async (key: string): Promise<string> => {
  // Input validation (optional but recommended)
  if (!key) {
    console.error("getS3ImageUrl called with empty key");
    throw new Error("Object key cannot be empty.");
  }
  if (!BUCKET_NAME) {
    console.error("BUCKET_NAME is not configured");
    throw new Error("S3 Bucket name is not configured.");
  }

  try {
    console.log(`Generating pre-signed URL for: ${BUCKET_NAME}/${key}`);
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Generate pre-signed URL that's valid for 1 hour (3600 seconds)
    // The SDK will now automatically call dynamicCognitoCredentialsProvider
    // via the credentialDefaultProvider chain to get credentials before signing.
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log(`Successfully generated pre-signed URL for ${key}`);
    return url;
  } catch (error) {
    console.error(`Error generating pre-signed URL for ${key}:`, error);
    // Add more specific error logging if needed
    // console.error("AWS Error Code:", (error as any).code);
    // console.error("AWS Error Message:", (error as any).message);
    throw new Error(`Failed to generate pre-signed URL for ${key}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// This function remains unchanged - direct URLs don't involve credentials/signing
export const getDirectS3Url = (key: string): string => {
  // Ensure region is correctly interpolated if bucket policy depends on it,
  // although standard S3 URLs often don't require region in the hostname.
  // Check your S3 setup if direct URLs don't work.
  // Using AWS_REGION variable for consistency:
  return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};


/**
 * Fetch available stock symbols from the S3 bucket
 */
export const fetchStockSymbols = async (): Promise<string[]> => {
  // Input validation (optional but recommended)
  if (!BUCKET_NAME) {
    console.error("BUCKET_NAME is not configured");
    throw new Error("S3 Bucket name is not configured.");
  }

  try {
    console.log(`Workspaceing objects from bucket: ${BUCKET_NAME} with delimiter '/'`);
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Delimiter: '/' // Use delimiter to list "directories"
    });

    // The SDK will use the configured credentialDefaultProvider (dynamicCognitoCredentialsProvider)
    const response = await s3Client.send(command);
    console.log("S3 ListObjectsV2 response received"); // Removed potentially large response log

    // Extract stock symbols from common prefixes (like "AAPL_polygon_min/")
    const symbols = (response.CommonPrefixes || [])
        .map(prefix => {
          const prefixStr = prefix.Prefix || "";
          // Updated Regex: Handles symbols like BRK.A or single letters more robustly
          // Assumes format SYMBOL_something/
          const match = prefixStr.match(/^([A-Z0-9.]+)(?:_.*)?\//);
          return match ? match[1] : null;
        })
        .filter((symbol): symbol is string => symbol !== null); // Type guard to filter out nulls

    console.log("Extracted stock symbols:", symbols);
    return symbols;
  } catch (error) {
    console.error("Error fetching stock symbols from S3:", error);
    throw new Error(`Failed to fetch stock symbols: ${error instanceof Error ? error.message : String(error)}`);
  }
};