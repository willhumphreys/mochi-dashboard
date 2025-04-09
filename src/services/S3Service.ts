import {
    GetObjectCommand,
    ListObjectsV2Command,
    ListObjectVersionsCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
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
    const missing = [!AWS_REGION && "VITE_AWS_REGION", !COGNITO_IDENTITY_POOL_ID && "VITE_COGNITO_IDENTITY_POOL_ID", !COGNITO_USER_POOL_ID && "VITE_COGNITO_USER_POOL_ID"].filter(Boolean).join(", ");
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
        const session = await fetchAuthSession({forceRefresh: false});
        const idToken = session.tokens?.idToken?.toString();

        // 2. Check if we got an ID Token
        if (!idToken) {
            console.error("S3 Service: No Cognito ID Token found in session. Cannot authenticate with Identity Pool.");
            throw new Error("User is not authenticated or session is invalid. Cannot retrieve AWS credentials.");
        }

        // 3. Create the Cognito Identity Pool provider configuration with the current token
        const cognitoProviderConfig = {
            clientConfig: {region: AWS_REGION}, identityPoolId: COGNITO_IDENTITY_POOL_ID, logins: {
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
    region: AWS_REGION, credentials: dynamicCognitoCredentialsProvider
});

/**
 * Lists all objects (keys) in the specified S3 bucket
 * @param bucketName - Name of the S3 bucket
 * @param prefix - Optional prefix to filter objects (defaults to empty string)
 * @returns Promise that resolves to an array of object keys
 */
export const listAllKeys = async (bucketName: string, prefix: string = ''): Promise<string[]> => {
    try {
        console.log(`Listing all keys in bucket: ${bucketName}${prefix ? ` with prefix: ${prefix}` : ''}`);

        let allKeys: string[] = [];
        let continuationToken: string | undefined = undefined;

        // S3 returns results in pages, so we need to loop until we get all keys
        do {
            const command: ListObjectsV2Command = new ListObjectsV2Command({
                Bucket: bucketName, Prefix: prefix, ContinuationToken: continuationToken
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
            Bucket: bucketName, Key: key
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
 * Fetches list of available brokers from S3
 * @returns Promise that resolves to an array of broker information
 */
export interface BrokerInfo {
    name: string;
    displayName: string;
}

export const getBrokers = async (): Promise<BrokerInfo[]> => {
    try {
        // List all folders under the brokers/ prefix
        const keys = await listAllKeys(LIVE_TRADES_BUCKET_NAME, 'brokers/');

        // Extract unique broker names from the keys
        const brokerSet = new Set<string>();

        keys.forEach(key => {
            // Extract broker name from path like 'brokers/broker_name/...'
            const match = key.match(/^brokers\/([^/]+)\//);
            if (match && match[1]) {
                brokerSet.add(match[1]);
            }
        });

        // Convert to array of broker info objects
        const brokers: BrokerInfo[] = Array.from(brokerSet).map(name => ({
            name, displayName: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')
        }));

        console.log(`Found ${brokers.length} brokers: ${brokers.map(b => b.name).join(', ')}`);
        return brokers;

    } catch (error) {
        console.error('Error fetching brokers list:', error);
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
export const getLiveTradeSymbols = async (broker: string, forceRefresh: boolean = false): Promise<string[]> => {
    const now = Date.now();

    // We need separate caches for each broker
    const cacheKey = `symbols_${broker}`;
    const cachedBrokerSymbols = symbolsCache[cacheKey];

    // Return cached result if available and not expired, unless forced refresh
    if (!forceRefresh && cachedBrokerSymbols && (now - cachedBrokerSymbols.timestamp < cacheExpiryMs)) {
        return cachedBrokerSymbols.symbols;
    }

    try {
        // List objects under the broker's symbols directory
        const prefix = `brokers/${broker}/symbols/`;

        const command = new ListObjectsV2Command({
            Bucket: LIVE_TRADES_BUCKET_NAME, Prefix: prefix, Delimiter: '/'
        });

        const response = await s3Client.send(command);

        // Extract symbol names from the CommonPrefixes
        // The structure will be like 'brokers/darwinex/symbols/AAPL/'
        const symbols = (response.CommonPrefixes || [])
            .map(prefix => {
                const prefixStr = prefix.Prefix || '';
                // Extract the symbol part from 'brokers/darwinex/symbols/AAPL/'
                const match = prefixStr.match(/^brokers\/[\w-]+\/symbols\/([A-Z]+-?(long|short)?)\/$/);

                return match ? match[1] : null;
            })
            .filter((symbol): symbol is string => symbol !== null)
            .sort();

        // Update cache for this broker
        symbolsCache[cacheKey] = {
            symbols, timestamp: now
        };

        return symbols;
    } catch (error) {
        console.error(`Error fetching live trade symbols for broker ${broker}:`, error);
        throw error;
    }
};

// We need to update the caching mechanism to support multiple brokers
type SymbolsCacheEntry = {
    symbols: string[]; timestamp: number;
};

// Object to store cache entries by broker
const symbolsCache: Record<string, SymbolsCacheEntry> = {};

// Cache expiry time - 5 minutes
const cacheExpiryMs = 5 * 60 * 1000;

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
            Bucket: BUCKET_NAME, Key: key,
        });

        // Generate pre-signed URL that's valid for 1 hour (3600 seconds)
        // The SDK will now automatically call dynamicCognitoCredentialsProvider
        // via the credentialDefaultProvider chain to get credentials before signing.
        const url = await getSignedUrl(s3Client, command, {expiresIn: 3600});
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
            Bucket: BUCKET_NAME, Delimiter: '/' // Use delimiter to list "directories"
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
export const addTradeForSymbol = async (symbol: string, newTrade: TradeData, broker: string): Promise<boolean> => {
    try {
        console.log(`Adding new trade for symbol: ${symbol} with broker: ${broker}`);

        // 1. Fetch current trades
        const currentTrades = await fetchLiveTradesForSymbol(symbol, broker);

        // 2. Add the new trade
        const updatedTrades = [...currentTrades, newTrade];

        // 3. Convert back to CSV
        const csv = Papa.unparse(updatedTrades);

        // 4. Upload to S3 with the correct path format
        const key = `brokers/${broker}/symbols/${symbol}/trades.csv`;

        const putCommand = new PutObjectCommand({
            Bucket: LIVE_TRADES_BUCKET_NAME,
            Key: key,
            Body: csv,
            ContentType: 'text/csv'
        });

        await s3Client.send(putCommand);
        console.log(`Successfully added trade for ${symbol} with broker ${broker}`);

        // Verify the write operation succeeded
        const verificationTrades = await fetchLiveTradesForSymbol(symbol, broker);
        console.log(`Verification: Fetched ${verificationTrades.length} trades after adding new trade`);

        return true;
    } catch (error) {
        console.error(`Failed to add trade for ${symbol} with broker ${broker}:`, error);
        throw error;
    }
}

export const fetchLiveTradesForSymbol = async (symbol: string, broker: string): Promise<TradeData[]> => {
    try {
        // Use the correct path format
        const key = `brokers/${broker}/symbols/${symbol}/trades.csv`;
        console.log(`Fetching trades from path: ${key}`);

        // ListObjectVersions to get the latest version ID
        const listVersionsCommand = new ListObjectVersionsCommand({
            Bucket: LIVE_TRADES_BUCKET_NAME,
            Prefix: key,
            MaxKeys: 1, // We only need the latest version
        });

        let versionId;
        try {
            const versionsResponse = await s3Client.send(listVersionsCommand);
            // Get the latest version ID if available
            if (versionsResponse.Versions && versionsResponse.Versions.length > 0) {
                // The first version in the list is the latest one
                versionId = versionsResponse.Versions[0].VersionId;
                console.log(`Using latest version ID: ${versionId} for ${key}`);
            }
        } catch (error) {
            console.warn(`Could not retrieve version information for ${key}:`, error);
            // Continue without version ID (will try to get the latest by default)
        }

        // Create the GetObject command, including VersionId if available
        const getCommand = new GetObjectCommand({
            Bucket: LIVE_TRADES_BUCKET_NAME,
            Key: key,
            VersionId: versionId
        });

        try {
            const response = await s3Client.send(getCommand);

            if (!response.Body) {
                console.log(`No content in S3 response for ${symbol} from broker ${broker}`);
                return [];
            }

            const csvContent = await response.Body.transformToString();

            // Parse the CSV content
            const parsedData = Papa.parse<TradeData>(csvContent, {
                header: true,
                dynamicTyping: true
            });

            const trades = parsedData.data.filter(item => Object.keys(item).length > 1);
            console.log(`Fetched ${trades.length} trades for ${symbol} from broker ${broker}`);
            console.log(trades);
            return trades;
        } catch (error) {
            if (error instanceof Error && error.name === 'NoSuchKey') {
                console.log(`No trades file exists yet for ${symbol} from broker ${broker}`);
                return [];
            }
            throw error;
        }
    } catch (error) {
        console.error(`Error fetching trades for ${symbol} from broker ${broker}:`, error);
        return [];
    }
};
// Add this to your S3Service.ts

/**
 * Creates a new ticker by saving an empty CSV file to S3 with proper headers
 * @param symbol - The ticker symbol to create (e.g., GOOGL)
 * @returns Promise that resolves when the file is successfully created
 */
/**
 * Creates a new ticker by saving an empty CSV file to S3 with proper headers
 * @param symbol - The ticker symbol to create (e.g., GOOGL)
 * @param broker - The broker for this ticker
 * @returns Promise that resolves when the file is successfully created
 */
export const createNewTicker = async (symbol: string, broker: string): Promise<void> => {
    try {
        // Validate the symbol format
        const symbolPattern = /^[A-Z]{1,5}(-long|-short)?$/;
        if (!symbolPattern.test(symbol)) {
            throw new Error("Symbol must be 1-5 uppercase letters, optionally followed by '-long' or '-short'");
        }

        // Validate broker is provided
        if (!broker) {
            throw new Error("Broker name is required");
        }

        // Create empty CSV with just the headers
        const headers = ",traderid,dayofweek,hourofday,stop,limit,tickoffset,tradeduration,outoftime\n";

        // Use the new directory structure
        const key = `brokers/${broker}/symbols/${symbol}/trades.csv`;

        // Create and send the PutObjectCommand
        const command = new PutObjectCommand({
            Bucket: LIVE_TRADES_BUCKET_NAME, Key: key, Body: headers, ContentType: 'text/csv'
        });

        await s3Client.send(command);
        console.log(`Created new ticker: ${symbol} for broker: ${broker}`);

        // Force refresh the list of available symbols for this broker
        await getLiveTradeSymbols(broker, true);

    } catch (error) {
        console.error(`Error creating new ticker ${symbol} for broker ${broker}:`, error);
        throw error;
    }
};

/**
 * Generates a pre-signed URL for an S3 object with temporary access
 * @param bucketName - Name of the S3 bucket
 * @param key - Object key (file path) in the bucket
 * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
 * @param region - AWS region (optional, defaults to client's region)
 * @returns Promise that resolves to a pre-signed URL
 */
export const getSignedS3Url = async (
    bucketName: string,
    key: string,
    expiresIn: number = 900, // 15 minutes default
    region?: string
): Promise<string> => {
    try {
        // Create a new client with the specified region if provided
        const client = region ? new S3Client({ region }) : s3Client;

        // Create the command to get the object
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        // Generate the signed URL
        const signedUrl = await getSignedUrl(client, command, { expiresIn });

        return signedUrl;
    } catch (error) {
        console.error(`Error generating signed URL for ${bucketName}/${key}:`, error);
        throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Reads and parses a CSV file from S3 using a pre-signed URL
 * @param bucketName - Name of the S3 bucket
 * @param key - Object key (file path) in the bucket
 * @param options - Additional options for URL generation and parsing
 * @returns Promise that resolves to an array of parsed data
 */
export const readCsvFromS3WithSignedUrl = async <T>(
    bucketName: string,
    key: string,
    options: {
        expiresIn?: number;
        region?: string;
        parseOptions?: Papa.ParseConfig;
    } = {}
): Promise<T[]> => {
    try {
        console.log(`Reading CSV file from bucket: ${bucketName}, key: ${key} using signed URL`);

        // Generate a signed URL for the S3 object
        const signedUrl = await getSignedS3Url(
            bucketName,
            key,
            options.expiresIn,
            options.region
        );

        // Fetch the content using the signed URL
        const response = await fetch(signedUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        // Get the CSV content
        const csvContent = await response.text();

        // Parse the CSV data using Papa Parse
        return new Promise<T[]>((resolve, reject) => {
            Papa.parse<T>(csvContent, {
                header: true,
                dynamicTyping: true, // Automatically convert numeric values
                skipEmptyLines: true,
                ...options.parseOptions, // Allow overriding default parse options
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
        console.error(`Error reading CSV from ${bucketName}/${key} with signed URL:`, error);
        throw new Error(`Failed to read CSV: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Reads data from an S3 object using a pre-signed URL and returns the raw response
 * This can be used for any file type, not just CSV
 * @param bucketName - Name of the S3 bucket
 * @param key - Object key (file path) in the bucket
 * @param options - Additional options for URL generation
 * @returns Promise that resolves to the fetch response
 */
export const getS3ObjectWithSignedUrl = async (
    bucketName: string,
    key: string,
    options: {
        expiresIn?: number;
        region?: string;
        responseType?: 'text' | 'json' | 'blob' | 'arrayBuffer';
    } = {}
): Promise<Response> => {
    try {
        // Generate a signed URL for the S3 object
        const signedUrl = await getSignedS3Url(
            bucketName,
            key,
            options.expiresIn,
            options.region
        );

        // Fetch the content using the signed URL
        const response = await fetch(signedUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        return response;
    } catch (error) {
        console.error(`Error fetching ${bucketName}/${key} with signed URL:`, error);
        throw new Error(`Failed to fetch S3 object: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Read JSON data from S3 using a pre-signed URL
 * @param bucketName - Name of the S3 bucket
 * @param key - Object key (file path) in the bucket
 * @param options - Additional options for URL generation
 * @returns Promise that resolves to the parsed JSON data
 */
export const readJsonFromS3WithSignedUrl = async <T>(
    bucketName: string,
    key: string,
    options: {
        expiresIn?: number;
        region?: string;
    } = {}
): Promise<T> => {
    try {
        const response = await getS3ObjectWithSignedUrl(bucketName, key, options);
        return await response.json() as T;
    } catch (error) {
        console.error(`Error reading JSON from ${bucketName}/${key}:`, error);
        throw new Error(`Failed to read JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Generic function to read a specific file format from S3 using a pre-signed URL
 * @param directUrl - The direct URL to the S3 object
 * @param options - Additional options for URL generation and fetching
 * @returns Promise that resolves to the response processed according to responseType
 */
export const fetchFromSignedUrl = async <T>(
    directUrl: string,
    options: {
        responseType: 'text' | 'json' | 'blob' | 'arrayBuffer';
        parseOptions?: Record<string, unknown>; // Type depends on responseType
    }
): Promise<T> => {
    try {
        // Extract bucket and key from the URL
        const url = new URL(directUrl);
        const hostParts = url.hostname.split('.');

        // Handle different URL formats (virtual-hosted vs path-style)
        let bucketName, key;

        if (hostParts[0].endsWith('s3') || hostParts[0] === 'localhost') {
            // Path-style URL (s3.region.amazonaws.com/bucket-name/key)
            const pathParts = url.pathname.split('/').filter(Boolean);
            bucketName = pathParts[0];
            key = pathParts.slice(1).join('/');
        } else {
            // Virtual-hosted style URL (bucket-name.s3.region.amazonaws.com/key)
            bucketName = hostParts[0];
            key = url.pathname.substring(1); // Remove leading slash
        }

        // Get the region from the hostname
        const regionMatch = url.hostname.match(/s3[.-]([a-z0-9-]+)/);
        const region = regionMatch ? regionMatch[1] : 'eu-central-1';

        // Generate a signed URL
        const signedUrl = await getSignedS3Url(bucketName, key, 900, region);

        // Fetch the content
        const response = await fetch(signedUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        // Process based on response type
        switch (options.responseType) {
            case 'text':
                return await response.text() as unknown as T;
            case 'json':
                return await response.json() as T;
            case 'blob':
                return await response.blob() as unknown as T;
            case 'arrayBuffer':
                return await response.arrayBuffer() as unknown as T;
            default:
                return await response.text() as unknown as T;
        }
    } catch (error) {
        console.error(`Error fetching from URL with signed URL:`, error);
        throw new Error(`Failed to fetch: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Converts a direct S3 URL to a signed URL for temporary access
 * @param directUrl - Direct S3 URL (https://bucket-name.s3.region.amazonaws.com/key)
 * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
 * @returns Promise that resolves to a pre-signed URL
 */
export const convertToSignedUrl = async (
    directUrl: string,
    expiresIn: number = 900
): Promise<string> => {
    try {
        // Parse the URL to extract bucket, key, and region
        const url = new URL(directUrl);
        const hostParts = url.hostname.split('.');

        let bucketName, key, region;

        // Determine URL format and extract components
        if (hostParts[0].endsWith('s3')) {
            // Path-style URL (s3.region.amazonaws.com/bucket-name/key)
            const pathParts = url.pathname.split('/').filter(Boolean);
            bucketName = pathParts[0];
            key = pathParts.slice(1).join('/');

            // Extract region from hostname
            region = hostParts[1];
        } else {
            // Virtual-hosted style (bucket-name.s3.region.amazonaws.com/key)
            bucketName = hostParts[0];
            key = url.pathname.substring(1); // Remove leading slash

            // Extract region from hostname
            region = hostParts[2];
        }

        // Generate a signed URL for the object
        return await getSignedS3Url(bucketName, key, expiresIn, region);
    } catch (error) {
        console.error(`Error converting to signed URL: ${directUrl}`, error);
        throw new Error(`Failed to convert to signed URL: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Deletes object from S3 and optionally uploads a new version in its place
 * @param bucketName - Name of the S3 bucket
 * @param key - Object key (path) in the bucket
 * @param newContent - Optional content to upload after deletion
 * @returns Promise that resolves when the operation completes
 */
export const updateCsvInS3 = async (
    bucketName: string,
    key: string,
    content: string
): Promise<void> => {
    try {
        // Simply put the new content, which will overwrite any existing file
        const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: content,
            ContentType: 'text/csv'
        });

        await s3Client.send(putCommand);
        console.log(`Updated CSV in bucket: ${bucketName}, key: ${key}`);
    } catch (error) {
        console.error(`Error updating CSV in S3:`, error);
        throw new Error(`Failed to update CSV in S3: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export {s3Client, LIVE_TRADES_BUCKET_NAME};

