// src/services/S3Service.ts
import {GetObjectCommand, ListObjectsV2Command, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

// Initialize the S3 client with complete credentials including session token
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION || "eu-central-1",
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
    sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN || "" // Required for temporary credentials
  }
});

// Base bucket name
const BUCKET_NAME = "mochi-prod-final-trader-ranking";

// Function to get a pre-signed URL for an S3 object
export const getS3ImageUrl = async (key: string): Promise<string> => {
  try {
    console.log(`Generating pre-signed URL for: ${BUCKET_NAME}/${key}`);

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Generate pre-signed URL that's valid for 1 hour
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log("Generated pre-signed URL successfully");
    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw new Error(`Failed to generate pre-signed URL: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Add alternative approach using direct S3 URLs if you have public images or want to try direct URLs
export const getDirectS3Url = (key: string): string => {
  return `https://${BUCKET_NAME}.s3.eu-central-1.amazonaws.com/${key}`;
};

/**
 * Fetch available stock symbols from the S3 bucket
 */
export const fetchStockSymbols = async (): Promise<string[]> => {
  try {
    // List objects in the bucket with delimiter to get folder-like structure
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Delimiter: '/'
    });

    const response = await s3Client.send(command);

    // Extract stock symbols from common prefixes
    return (response.CommonPrefixes || [])
        .map(prefix => {
          // Get the prefix string (e.g., "AAPL_polygon_min/")
          const prefixStr = prefix.Prefix || "";
          // Extract the symbol part (e.g., "AAPL" from "AAPL_polygon_min/")
          const match = prefixStr.match(/^([A-Z]+)_polygon_min\//);
          return match ? match[1] : null;
        })
        .filter((symbol): symbol is string => symbol !== null);
  } catch (error) {
    console.error("Error fetching stock symbols from S3:", error);
    throw error;
  }
};
