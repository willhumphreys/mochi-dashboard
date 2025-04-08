// BrokerService.ts
import {GetObjectCommand, ListObjectsV2Command, PutObjectCommand} from "@aws-sdk/client-s3";
import Papa from "papaparse";
import {TradeData} from "../types.ts";

// Import the S3 client and bucket names from S3Service
// Make sure to import these from your existing S3Service.ts file
import {s3Client, LIVE_TRADES_BUCKET_NAME} from "./S3Service";

// Constants
const BROKERS_FILE_KEY = "brokers.csv"; // File path for the brokers list

// Interface for broker information
export interface BrokerInfo {
  name: string;        // Unique identifier (lowercase, alphanumeric with hyphens)
  displayName: string; // User-friendly display name
  active: boolean;     // Whether this broker is active
}

/**
 * Fetches the list of brokers from S3
 * @returns Promise that resolves to an array of BrokerInfo objects
 */
export const getBrokers = async (): Promise<BrokerInfo[]> => {
  try {
    const command = new GetObjectCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Key: BROKERS_FILE_KEY
    });
    
    try {
      const response = await s3Client.send(command);
      const csvData = await response.Body?.transformToString();
      
      if (!csvData) {
        console.warn("Brokers file exists but is empty");
        return [];
      }
      
      // Parse CSV data
      const parsedResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
      });
      
      // Interface to represent the raw CSV data structure
      interface BrokerCsvRow {
        name?: string;
        displayName?: string;
        active?: string;
      }

      // Map to BrokerInfo objects and filter out invalid entries
      const brokers = (parsedResult.data as BrokerCsvRow[])
        .map(row => ({
          name: row.name || '',
          displayName: row.displayName || row.name || '',
          active: row.active?.toLowerCase() === 'true'
        }))
        .filter(broker => broker.name); // Filter out invalid entries
      
      if (brokers.length === 0) {
        // Return default if no valid brokers found
        return [];
      }
      
      return brokers;
    } catch (error: unknown) {
      // If the file doesn't exist, create it with a default broker
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
        console.log("Brokers file not found, creating default file");
        await createDefaultBrokersFile();
        return [];
      }

      throw error;
    }
  } catch (error) {
    console.error("Error fetching brokers:", error);
    // Return a default broker in case of error
    return [];
  }
};

/**
 * Creates the default brokers.csv file in S3
 */
export const createDefaultBrokersFile = async (): Promise<void> => {
  const defaultCSV = "name,displayName,active\ndarwinex,Darwinex,true";
  
  const command = new PutObjectCommand({
    Bucket: LIVE_TRADES_BUCKET_NAME,
    Key: BROKERS_FILE_KEY,
    Body: defaultCSV,
    ContentType: "text/csv"
  });
  
  await s3Client.send(command);
  console.log("Created default brokers file in S3");
};

/**
 * Adds a new broker to the brokers list
 * @param broker - Broker information to add
 * @returns Promise that resolves when the broker is added
 */
export const addBroker = async (broker: BrokerInfo): Promise<void> => {
  // Validate broker name (no spaces, only alphanumeric and hyphens)
  if (!broker.name || !/^[a-z0-9-]+$/.test(broker.name)) {
    throw new Error("Broker name must be lowercase alphanumeric with hyphens only");
  }
  
  // Get current brokers
  const currentBrokers = await getBrokers();
  
  // Check if broker already exists
  if (currentBrokers.some(b => b.name === broker.name)) {
    throw new Error(`Broker "${broker.name}" already exists`);
  }
  
  // Add new broker
  currentBrokers.push(broker);
  
  // Save updated brokers list
  await saveBrokers(currentBrokers);
  
  // Create the broker folder in S3
  await createBrokerFolder(broker.name);
};

/**
 * Updates an existing broker's information
 * @param brokerName - Name of the broker to update
 * @param updatedInfo - Updated broker information
 * @returns Promise that resolves when the broker is updated
 */
export const updateBroker = async (
  brokerName: string, 
  updatedInfo: Partial<Omit<BrokerInfo, 'name'>>
): Promise<void> => {
  // Get current brokers
  const currentBrokers = await getBrokers();
  
  // Find broker index
  const brokerIndex = currentBrokers.findIndex(b => b.name === brokerName);
  
  if (brokerIndex === -1) {
    throw new Error(`Broker "${brokerName}" not found`);
  }
  
  // Update broker
  currentBrokers[brokerIndex] = {
    ...currentBrokers[brokerIndex],
    ...updatedInfo
  };
  
  // Save updated brokers list
  await saveBrokers(currentBrokers);
};

/**
 * Removes a broker from the list
 * @param brokerName - Name of the broker to remove
 * @returns Promise that resolves when the broker is removed
 */
export const removeBroker = async (brokerName: string): Promise<void> => {
  // Get current brokers
  const currentBrokers = await getBrokers();
  
  // Filter out the broker to remove
  const updatedBrokers = currentBrokers.filter(b => b.name !== brokerName);
  
  // Check if broker was found
  if (updatedBrokers.length === currentBrokers.length) {
    throw new Error(`Broker "${brokerName}" not found`);
  }
  
  // Save updated brokers list
  await saveBrokers(updatedBrokers);
  
  // Note: This doesn't delete the broker's data from S3
  // You may want to add logic to delete or archive the broker's data
};

/**
 * Saves the brokers list to S3
 * @param brokers - Array of broker information to save
 * @returns Promise that resolves when the brokers are saved
 */
export const saveBrokers = async (brokers: BrokerInfo[]): Promise<void> => {
  // Convert brokers to CSV
  const csv = Papa.unparse(brokers);
  
  const command = new PutObjectCommand({
    Bucket: LIVE_TRADES_BUCKET_NAME,
    Key: BROKERS_FILE_KEY,
    Body: csv,
    ContentType: "text/csv"
  });
  
  await s3Client.send(command);
  console.log("Saved brokers list to S3");
};

/**
 * Creates a new folder for a broker in S3
 * @param brokerName - Name of the broker
 * @returns Promise that resolves when the folder is created
 */
export const createBrokerFolder = async (brokerName: string): Promise<void> => {
  // In S3, folders are represented by objects with a trailing slash
  const command = new PutObjectCommand({
    Bucket: LIVE_TRADES_BUCKET_NAME,
    Key: `${brokerName}/`,
    Body: '' // Empty body for folder objects
  });
  
  await s3Client.send(command);
  console.log(`Created broker folder: ${brokerName}/`);
};

// Cache for symbols by broker
const cachedSymbols: Record<string, string[]> = {};
const lastFetchTimes: Record<string, number> = {};
const cacheExpiryMs = 60000; // 1 minute cache

/**
 * Gets all available symbols for live trades from a specific broker
 * @param broker - Broker name to fetch symbols from
 * @param forceRefresh - Whether to force a refresh of the symbols cache
 * @returns A promise that resolves to an array of symbol strings
 */
export const getLiveTradeSymbols = async (
  broker: string,
  forceRefresh: boolean = false
): Promise<string[]> => {
  const now = Date.now();
  
  // Return cached result if available and not expired, unless forced refresh
  if (
    !forceRefresh && 
    cachedSymbols[broker] && 
    lastFetchTimes[broker] &&
    (now - lastFetchTimes[broker] < cacheExpiryMs)
  ) {
    return cachedSymbols[broker];
  }
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Prefix: `${broker}/`,
      Delimiter: '/'
    });
    
    const response = await s3Client.send(command);
    
    // Extract symbol names from the list of files (remove .csv extension)
    const symbols = (response.Contents || [])
      .map(item => {
        const key = item.Key || '';
        // Match pattern: broker/SYMBOL.csv
        const match = key.match(new RegExp(`^${broker}/([A-Z]+)\\.csv$`));
        return match ? match[1] : null;
      })
      .filter((symbol): symbol is string => symbol !== null)
      .sort();
    
    // Update cache for this broker
    cachedSymbols[broker] = symbols;
    lastFetchTimes[broker] = now;
    
    return symbols;
  } catch (error) {
    console.error(`Error fetching live trade symbols for broker ${broker}:`, error);
    throw error;
  }
};

/**
 * Fetches live trades for a specific symbol from a specific broker
 * @param symbol - Symbol to fetch trades for
 * @param broker - Broker to fetch trades from
 * @returns Promise that resolves to an array of trade data
 */
export const fetchLiveTradesForSymbol = async (
  symbol: string,
  broker: string
): Promise<TradeData[]> => {
  try {
    const command = new GetObjectCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Key: `${broker}/${symbol}.csv`
    });
    
    const response = await s3Client.send(command);
    const csvData = await response.Body?.transformToString();
    
    if (!csvData) {
      return [];
    }
    
    // Parse CSV data
    const parsedResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true // Automatically convert numeric values
    });
    
    // Map to TradeData objects
    const trades = (parsedResult.data as Record<string, unknown>[])
      .map(row => ({
        id: typeof row.id === 'number' || typeof row.id === 'string' ? Number(row.id) : 0,
        traderid: Number(row.traderid),
        dayofweek: Number(row.dayofweek),
        hourofday: Number(row.hourofday),
        stop: Number(row.stop),
        limit: Number(row.limit),
        tickoffset: Number(row.tickoffset),
        tradeduration: Number(row.tradeduration),
        outoftime: Number(row.outoftime),
        timestamp: Number(row.timestamp),
        price: Number(row.price) ,
        volume: Number(row.volume)
      }))
      .filter(trade => 
        !isNaN(trade.timestamp) && 
        !isNaN(trade.price) && 
        !isNaN(trade.volume)
      );
    
    return trades;
  } catch (error) {
    console.error(`Error fetching live trades for ${broker}/${symbol}:`, error);
    throw error;
  }
};

/**
 * Creates a new ticker for a specific broker
 * @param symbol - Symbol to create
 * @param broker - Broker to create the ticker for
 * @returns Promise that resolves when the ticker is created
 */
export const createNewTicker = async (
  symbol: string,
  broker: string
): Promise<void> => {
  try {
    // Validate symbol (uppercase letters only)
    if (!symbol || !/^[A-Z]+$/.test(symbol)) {
      throw new Error("Symbol must contain uppercase letters only");
    }
    
    // Create an empty CSV file for the new ticker
    const command = new PutObjectCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Key: `${broker}/${symbol}.csv`,
      Body: 'timestamp,price,volume,side\n', // CSV header
      ContentType: "text/csv"
    });
    
    await s3Client.send(command);
    console.log(`Created new ticker: ${broker}/${symbol}`);
    
    // Invalidate cache for this broker
    delete cachedSymbols[broker];
    delete lastFetchTimes[broker];
  } catch (error) {
    console.error(`Error creating ticker ${broker}/${symbol}:`, error);
    throw error;
  }
};

/**
 * Adds a trade to a symbol's CSV file
 * @param trade - Trade data to add
 * @param symbol - Symbol to add the trade to
 * @param broker - Broker name
 * @returns Promise that resolves when the trade is added
 */
export const addTradeToSymbol = async (
  trade: TradeData,
  symbol: string,
  broker: string
): Promise<void> => {
  try {
    // First, fetch current trades
    const currentTrades = await fetchLiveTradesForSymbol(symbol, broker);
    
    // Add new trade
    currentTrades.push(trade);
    
    // Sort by timestamp (newest first)
    currentTrades.sort((a, b) => b.timestamp - a.timestamp);
    
    // Convert to CSV
    const csv = Papa.unparse({
      fields: ["timestamp", "price", "volume", "side"],
      data: currentTrades.map(t => [t.timestamp, t.price, t.volume, t.side])
    });
    
    // Upload updated CSV
    const command = new PutObjectCommand({
      Bucket: LIVE_TRADES_BUCKET_NAME,
      Key: `${broker}/${symbol}.csv`,
      Body: csv,
      ContentType: "text/csv"
    });
    
    await s3Client.send(command);
    console.log(`Added trade to ${broker}/${symbol}`);
  } catch (error) {
    console.error(`Error adding trade to ${broker}/${symbol}:`, error);
    throw error;
  }
};