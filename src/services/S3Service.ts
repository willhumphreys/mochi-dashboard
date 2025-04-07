import {GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {fromCognitoIdentityPool} from "@aws-sdk/credential-providers";
import {fetchAuthSession} from 'aws-amplify/auth';
import Papa from "papaparse";
import type {AwsCredentialIdentity} from "@aws-sdk/types";
import {TradeData} from "../types.ts";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

// Region and Pool IDs from environment variables
const AWS_REGION = import.meta.env.VITE_REGION;
const COGNITO_IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
const COGNITO_USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID;

const BUCKET_NAME = "mochi-prod-final-trader-ranking"; // Ensure this is correct
const LIVE_TRADES_BUCKET_NAME = "mochi-prod-live-trades"; // Ensure this is correct


// Validate required environment variables
if (!AWS_REGION || !COGNITO_IDENTITY_POOL_ID || !COGNITO_USER_POOL_ID) {
  const missing = [
    !AWS_REGION && "VITE_AWS_REGION",
    !COGNITO_IDENTITY_POOL_ID && "VITE_COGNITO_IDENTITY_POOL_ID",
    !COGNITO_USER_POOL_ID && "VITE_COGNITO_USER_POOL_ID"
  ].filter(Boolean).join(", ");
  console.error(`S3 Service Error: Missing required environment variables: ${missing}`);
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
    const session = await fetchAuthSession({ forceRefresh: false });
    const idToken = session.tokens?.idToken?.toString();

    // 2. Check if we got an ID Token
    if (!idToken) {
      console.error("S3 Service: No Cognito ID Token found in session. Cannot authenticate with Identity Pool.");
      throw new Error("User is not authenticated or session is invalid. Cannot retrieve AWS credentials.");
    }

    // 3. Create the Cognito Identity Pool provider configuration with the current token
    const cognitoProviderConfig = {
      clientConfig: { region: AWS_REGION },
      identityPoolId: COGNITO_IDENTITY_POOL_ID,
      logins: {
        [USER_POOL_PROVIDER_ID]: idToken
      }
    };

    // 4. Get the actual provider function from the SDK using the dynamic config
    const cognitoProvider = fromCognitoIdentityPool(cognitoProviderConfig);

    // 5. Invoke the provider function to fetch AWS credentials
    console.log("S3 Service: Fetching credentials from Cognito Identity Pool with ID token.");
    const credentials = await cognitoProvider();
    console.log("S3 Service: Credentials successfully obtained.");
    return credentials;

  } catch (error) {
    console.error("S3 Service: Failed to get credentials via dynamic provider:", error);
    throw error;
  }
};

// Initialize the S3 client using our custom async function as a credentials provider
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: dynamicCognitoCredentialsProvider
});

/**
 * Lists all objects (keys) in the specified S3 bucket
 * @param bucketName - Name of the S3 bucket
 * @param prefix - Optional prefix to filter objects (defaults to empty string)
 * @returns Promise that resolves to an array of object keys
 */
export const listAllKeys = async (
    bucketName: string,
    prefix: string = ''
): Promise<string[]> => {
  try {
    console.log(`Listing all keys in bucket: ${bucketName}${prefix ? ` with prefix: ${prefix}` : ''}`);

    let allKeys: string[] = [];
    let continuationToken: string | undefined = undefined;

    // S3 returns results in pages, so we need to loop until we get all keys
    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken
      });

      const response = await s3Client.send(command);

      // Add the keys from this page to our result array
      if (response.Contents) {
        const keys = response.Contents.map(obj => obj.Key).filter((key): key is string => key !== undefined);
        allKeys = [...allKeys, ...keys];
      }

      // Check if there are more results to fetch
      continuationToken = response.NextContinuationToken;

    } while (continuationToken);

    console.log(`Retrieved ${allKeys.length} keys from bucket ${bucketName}`);
    return allKeys;

  } catch (error) {
    console.error(`Error listing keys in bucket ${bucketName}:`, error);
    throw new Error(`Failed to list keys: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Reads and parses a CSV file from S3
 * @param bucketName - Name of the S3 bucket
 * @param key - Object key (file path) in the bucket
 * @returns Promise that resolves to an array of parsed trade data
 */
export const readCsvFromS3 = async <T = TradeData>(
    bucketName: string,
    key: string
): Promise<T[]> => {
  try {
    console.log(`Reading CSV file from bucket: ${bucketName}, key: ${key}`);

    // Create the command to get the object
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    // Fetch the object from S3
    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error('No content in S3 response');
    }

    // Convert the response body to text
    const csvContent = await response.Body.transformToString();

// Parse the CSV data using Papa Parse
    return new Promise<T[]>((resolve, reject) => {
      Papa.parse<T>(csvContent, {
        header: true,
        dynamicTyping: true, // Automatically convert numeric values
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.warn('CSV parsing completed with errors:', results.errors);
          }
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });

  } catch (error) {
    console.error(`Error reading CSV from ${bucketName}/${key}:`, error);
    throw new Error(`Failed to read CSV: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Read CSV data from the mochi-prod-live-trades bucket
 * @param symbol - Stock symbol (e.g., 'AAPL')
 * @returns Promise that resolves to an array of trade data
 */
import { ListObjectVersionsCommand } from "@aws-sdk/client-s3";

export const fetchLiveTradesForSymbol = async (symbol: string): Promise<TradeData[]> => {
  try {
    const key = `${symbol}.csv`;

    // Step 1: Get the latest version ID explicitly
    const listVersionsCommand = new ListObjectVersionsCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Prefix: key,
      MaxKeys: 1
    });

    const versionsList = await s3Client.send(listVersionsCommand);

    // Log the versions (helpful for debugging)
    console.log(`Versions for ${key}:`, JSON.stringify(versionsList.Versions));

    if (!versionsList.Versions || versionsList.Versions.length === 0) {
      throw new Error(`No versions found for ${key}`);
    }

    // Get the latest version ID (versions are returned in descending order by date)
    const latestVersionId = versionsList.Versions[0].VersionId;
    console.log(`Using version ID: ${latestVersionId} for ${key}`);

    // Step 2: Fetch the object with the explicit version ID
    const getObjectCommand = new GetObjectCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Key: key,
      VersionId: latestVersionId // This is the key difference!
    });

    const response = await s3Client.send(getObjectCommand);

    // Step 3: Process the response as you were before
    if (!response.Body) {
      throw new Error('No content in S3 response');
    }

    const csvContent = await response.Body.transformToString();

    return new Promise<TradeData[]>((resolve, reject) => {
      Papa.parse<TradeData>(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error(`Error fetching live trades for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Gets all available stock symbols in the live trades bucket
 * @returns Promise that resolves to an array of symbols (without .csv extension)
 */
// This needs to be added or updated in your S3Service.ts

/**
 * Gets all available symbols for live trades
 * @param forceRefresh - Whether to force a refresh of the symbols cache
 * @returns A promise that resolves to an array of symbol strings
 */
    // Add caching mechanism - static variable within the function
let cachedSymbols: string[] | null = null;
let lastFetchTime: number = 0;
const cacheExpiryMs = 60000; // 1 minute cache
export const getLiveTradeSymbols = async (forceRefresh: boolean = false): Promise<string[]> => {

  const now = Date.now();

  // Return cached result if available and not expired, unless forced refresh
  if (!forceRefresh && cachedSymbols && (now - lastFetchTime < cacheExpiryMs)) {
    return cachedSymbols;
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Delimiter: '/'
    });

    const response = await s3Client.send(command);

    // Extract symbol names from the list of files (remove .csv extension)
    const symbols = (response.Contents || [])
        .map(item => {
          const key = item.Key || '';
          const match = key.match(/^([A-Z]+)\.csv$/);
          return match ? match[1] : null;
        })
        .filter((symbol): symbol is string => symbol !== null)
        .sort();

    // Update cache
    cachedSymbols = symbols;
    lastFetchTime = now;

    return symbols;
  } catch (error) {
    console.error('Error fetching live trade symbols:', error);
    throw error;
  }
};


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

// Add this function to S3Service.ts

/**
 * Adds a new trade to the specified symbol's trade file
 * @param symbol - The trading symbol (e.g., 'AAPL')
 * @param newTrade - The trade data to add
 * @returns Promise that resolves when the trade is successfully added
 */
export const addTradeForSymbol = async (
    symbol: string,
    newTrade: TradeData
): Promise<boolean> => {
  try {
    console.log(`Adding new trade for symbol: ${symbol}`);

    // 1. Fetch current trades
    const currentTrades = await fetchLiveTradesForSymbol(symbol);

    // 2. Add the new trade
    const updatedTrades = [...currentTrades, newTrade];

    // 3. Convert back to CSV
    const csv = Papa.unparse(updatedTrades);

    // 4. Upload to S3
    const key = `${symbol}.csv`;

    const putCommand = new PutObjectCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Key: key,
      Body: csv,
      ContentType: 'text/csv'
    });

    await s3Client.send(putCommand);
    console.log(`Successfully added trade for ${symbol}`);
    return true;
  } catch (error) {
    console.error(`Failed to add trade for ${symbol}:`, error);
    throw error;
  }
};

// Add this to your S3Service.ts

/**
 * Creates a new ticker by saving an empty CSV file to S3 with proper headers
 * @param symbol - The ticker symbol to create (e.g., GOOGL)
 * @returns Promise that resolves when the file is successfully created
 */
export const createNewTicker = async (symbol: string): Promise<void> => {
  try {
    // Validate the symbol format
    const symbolPattern = /^[A-Z]{1,5}$/;
    if (!symbolPattern.test(symbol)) {
      throw new Error("Symbol must be 1-5 uppercase letters");
    }

    // Create empty CSV with just the headers
    const headers = "date,symbol,price,quantity,side,notional\n";
    const key = `${symbol}.csv`;

    // Create and send the PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Key: key,
      Body: headers,
      ContentType: 'text/csv'
    });

    await s3Client.send(command);
    console.log(`Created new ticker: ${symbol}`);

    // Force refresh the list of available symbols
    await getLiveTradeSymbols(true);

  } catch (error) {
    console.error(`Error creating new ticker ${symbol}:`, error);
    throw error;
  }
};

