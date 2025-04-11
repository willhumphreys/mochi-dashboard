// src/components/TradesTable2.tsx
import { useEffect, useState } from 'react';
import { getSignedS3Url, LIVE_TRADES_BUCKET_NAME, readCsvFromS3WithSignedUrl } from "./services/S3Service.ts";
import Papa from 'papaparse';
import {DEFAULT_DATASOURCE} from "./config/datasourceConfig.ts";

// Define the interface for the new data format
interface TradeResultData {
    PlaceDateTime: string;
    FilledPrice: number;
    ClosingPrice: number;
    Profit: number;
    RunningTotalProfit: number;
    State: string;
}

interface TradesTable2Props {
    symbol?: string;
    tradeData?: TradeResultData[];
    datasource?: string;
    tradesUrl?: string;
}

export const TradesTable2: React.FC<TradesTable2Props> = ({
                                                              symbol: propSymbol,
                                                              tradeData: propTradeData,
                                                              datasource = DEFAULT_DATASOURCE,
                                                              tradesUrl
                                                          }) => {
    const [tradeData, setTradeData] = useState<TradeResultData[]>(propTradeData || []);
    const [symbol, setSymbol] = useState<string>(propSymbol || '');
    const [loading, setLoading] = useState<boolean>(!!tradesUrl);
    const [error, setError] = useState<string | null>(null);

    // Define styles for positive and negative profits
    const profitStyle = { color: '#00b300' }; // Green color
    const lossStyle = { color: '#ff0000' };   // Red color

    useEffect(() => {
        // Update state when prop changes directly
        if (propTradeData) {
            setTradeData(propTradeData);
        }
        if (propSymbol) {
            setSymbol(propSymbol);
        }
    }, [propTradeData, propSymbol]);

    useEffect(() => {
        // Handle CSV URL case
        if (!tradesUrl) return;

        const fetchAndParseCsv = async () => {
            try {
                setLoading(true);
                setError(null);

                // Extract symbol from URL if not provided as prop
                if (!propSymbol) {
                    const urlParts = tradesUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const symbolMatch = fileName.match(/^([A-Z0-9]+)_/);
                    if (symbolMatch && symbolMatch[1]) {
                        setSymbol(symbolMatch[1]);
                    }
                }

                let csvData: Record<string, string | number | boolean | undefined>[];

                // Check if tradesUrl is a direct S3 URL
                if (tradesUrl.includes('amazonaws.com')) {
                    // Parse the S3 URL to extract bucket name and key
                    let bucketName: string;
                    let objectKey: string;

                    try {
                        // Extract bucket and key from URL
                        const url = new URL(tradesUrl);
                        const hostParts = url.hostname.split('.');

                        if (hostParts[0].endsWith('-s3') || hostParts[1] === 's3') {
                            // URL format: https://bucket-name.s3.region.amazonaws.com/key
                            bucketName = hostParts[0];
                            objectKey = url.pathname.substring(1); // Remove leading slash
                        } else if (hostParts[0] === 's3') {
                            // URL format: https://s3.region.amazonaws.com/bucket-name/key
                            const pathParts = url.pathname.split('/');
                            bucketName = pathParts[1];
                            objectKey = pathParts.slice(2).join('/');
                        } else {
                            throw new Error('Unable to parse S3 URL format');
                        }

                        if (!bucketName) {
                            throw new Error('Could not extract bucket name from URL');
                        }
                    } catch (parseError) {
                        console.error('Error parsing S3 URL:', parseError);
                        throw new Error(`Failed to parse S3 URL: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
                    }

                    // Use the getSignedS3Url function with the extracted bucket and key
                    const signedUrl = await getSignedS3Url(bucketName, objectKey, 900); // 15 minutes expiration

                    // Fetch data using the signed URL
                    const response = await fetch(signedUrl);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
                    }

                    const csvContent = await response.text();

                    // Parse CSV content with Papa Parse
                    const parseResult = await new Promise<Papa.ParseResult<Record<string, string | number | boolean | undefined>>>((resolve, reject) => {
                        Papa.parse<Record<string, string | number | boolean | undefined>>(csvContent, {
                            header: true,
                            dynamicTyping: true,
                            skipEmptyLines: true,
                            complete: results => resolve(results),
                            error: (err: Error) => reject(new Error(`CSV parsing error: ${err.message}`))
                        });
                    });

                    csvData = parseResult.data;
                } else {
                    // Handle the case where tradesUrl is a key path rather than a full URL
                    const s3Key = tradesUrl;

                    // Use the readCsvFromS3WithSignedUrl function
                    csvData = await readCsvFromS3WithSignedUrl<Record<string, string | number | boolean | undefined>>(
                        LIVE_TRADES_BUCKET_NAME,
                        s3Key,
                        {
                            expiresIn: 900, // 15 minutes
                            parseOptions: {
                                header: true,
                                dynamicTyping: true,
                                skipEmptyLines: true
                            }
                        }
                    );
                }

                // Process parsed data to ensure all required fields with proper types
                const processedData: TradeResultData[] = csvData.map(row => {
                    // Helper function to safely parse numeric fields
                    const safeParseFloat = (value: unknown, defaultValue: number = 0): number => {
                        if (typeof value === 'number') return value;
                        if (typeof value === 'string') return parseFloat(value) || defaultValue;
                        return defaultValue;
                    };

                    // Helper to safely get string values
                    const safeString = (value: unknown, defaultValue: string = ''): string => {
                        if (typeof value === 'string') return value;
                        if (value === null || value === undefined) return defaultValue;
                        return String(value);
                    };

                    return {
                        PlaceDateTime: safeString(row.PlaceDateTime),
                        FilledPrice: safeParseFloat(row.FilledPrice),
                        ClosingPrice: safeParseFloat(row.ClosingPrice),
                        Profit: safeParseFloat(row.Profit),
                        RunningTotalProfit: safeParseFloat(row.RunningTotalProfit),
                        State: safeString(row.State)
                    };
                });

                setTradeData(processedData);
                setLoading(false);

            } catch (err) {
                console.error('Error fetching and parsing CSV:', err);
                setError(`Error loading trade results: ${err instanceof Error ? err.message : 'Unknown error'}`);
                setLoading(false);
            }
        };

        fetchAndParseCsv();
    }, [tradesUrl, propSymbol]);

    if (loading) {
        return <div>Loading trade results...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (tradeData.length === 0) {
        return <div>No trade results available.</div>;
    }

    // Calculate total profit
    const totalProfit = tradeData.reduce((sum, trade) => sum + trade.Profit, 0);

    return (
        <div className="trades-table-container">
            <h3>{symbol} Trade Results {datasource ? `(${datasource})` : ''}</h3>

            <div className="summary">
                <p>Total trades: {tradeData.length}</p>
                <p>Total profit: <span style={totalProfit >= 0 ? profitStyle : lossStyle}>
                    {totalProfit.toFixed(2)}
                </span></p>
                <p>Average profit per trade: <span style={(totalProfit / tradeData.length) >= 0 ? profitStyle : lossStyle}>
                    {(totalProfit / tradeData.length).toFixed(2)}
                </span></p>
            </div>

            <table className="trades-table">
                <thead>
                <tr>
                    <th>Date/Time</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>Profit</th>
                    <th>Running Total</th>
                    <th>Exit Reason</th>
                </tr>
                </thead>
                <tbody>
                {tradeData.map((trade, index) => (
                    <tr key={index}>
                        <td>{trade.PlaceDateTime}</td>
                        <td>{trade.FilledPrice}</td>
                        <td>{trade.ClosingPrice}</td>
                        <td style={trade.Profit >= 0 ? profitStyle : lossStyle}>
                            {trade.Profit}
                        </td>
                        <td style={trade.RunningTotalProfit >= 0 ? profitStyle : lossStyle}>
                            {trade.RunningTotalProfit}
                        </td>
                        <td>{trade.State}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};