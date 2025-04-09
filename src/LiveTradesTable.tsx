// src/components/TradesTable.tsx
import {useEffect, useState} from 'react';
import {TradeData} from './types';
import {getSignedS3Url, LIVE_TRADES_BUCKET_NAME, readCsvFromS3WithSignedUrl} from "./services/S3Service.ts";
import Papa from 'papaparse';
import '@aws-amplify/ui-react/styles.css';

// Add to your imports
import { Button, Card, Flex, Heading, Text, View } from '@aws-amplify/ui-react';





interface TradesTableProps {
    symbol?: string;
    tradeData?: TradeData[];
    broker?: string;
    tradesUrl?: string;
}

export const TradesTable: React.FC<TradesTableProps> = ({
                                                            symbol: propSymbol,
                                                            tradeData: propTradeData,
                                                            broker = 'Unknown',
                                                            tradesUrl
                                                        }) => {
    const [tradeData, setTradeData] = useState<TradeData[]>(propTradeData || []);
    const [symbol, setSymbol] = useState<string>(propSymbol || '');
    const [loading, setLoading] = useState<boolean>(!!tradesUrl);
    const [error, setError] = useState<string | null>(null);

// State to control dialog visibility and track row to be deleted
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
    const [rowToDelete, setRowToDelete] = useState<number | null>(null);

// Single function to handle opening the delete confirmation dialog
    const handleDeleteRow = (index: number) => {
        setRowToDelete(index);
        setDeleteConfirmOpen(true);
    };

// Function to handle the actual deletion
    const confirmDelete = () => {
        if (rowToDelete !== null) {
            // Perform your delete operation here using rowToDelete
            console.log(`Deleting row at index: ${rowToDelete}`);

            // Reset states after deletion
            setDeleteConfirmOpen(false);
            setRowToDelete(null);
        }
    };

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
                    // Use the bucket name provided in the constant and the tradesUrl as the key
                    const s3Key = tradesUrl;

                    // Use the readCsvFromS3WithSignedUrl function
                    csvData = await readCsvFromS3WithSignedUrl<Record<string, string | number | boolean | undefined>>(LIVE_TRADES_BUCKET_NAME, s3Key, {
                        expiresIn: 900, // 15 minutes
                        parseOptions: {
                            header: true, dynamicTyping: true, skipEmptyLines: true
                        }
                    });
                }

                // Process parsed data to ensure all required fields with proper types
                const processedData: TradeData[] = csvData.map(row => {
                    // Properly handle the id field
                    let idValue: number;
                    if (row.id !== undefined) {
                        if (typeof row.id === 'number') {
                            idValue = row.id;
                        } else if (typeof row.id === 'string') {
                            idValue = parseInt(row.id, 10);
                        } else {
                            idValue = Math.floor(Date.now() + Math.random() * 10000);
                        }
                    } else {
                        idValue = Math.floor(Date.now() + Math.random() * 10000);
                    }

                    // Helper function to safely parse numeric fields
                    const safeParseInt = (value: unknown, defaultValue: number = 0): number => {
                        if (typeof value === 'number') return value;
                        if (typeof value === 'string') return parseInt(value, 10) || defaultValue;
                        return defaultValue;
                    };

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
                        id: isNaN(idValue) ? Math.floor(Date.now() + Math.random() * 10000) : idValue,
                        traderid: safeParseInt(row.traderid || row.TraderID, 0),
                        broker: safeString(row.broker || broker),
                        dayofweek: safeParseInt(row.dayofweek || row.DayOfWeek, 0),
                        hourofday: safeParseInt(row.hourofday || row.HourOfDay, 0),
                        stop: safeParseFloat(row.stop || row.Stop, 0),
                        limit: safeParseFloat(row.limit || row.Limit, 0),
                        tickoffset: safeParseFloat(row.tickoffset || row.TickOffset, 0),
                        tradeduration: safeParseInt(row.tradeduration || row.TradeDuration, 0),
                        outoftime: safeParseInt(row.outoftime || row.OutOfTime, 0)
                    };
                });

                setTradeData(processedData);
                setLoading(false);

            } catch (err) {
                console.error('Error fetching and parsing CSV:', err);
                setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                setLoading(false);
            }
        };
        fetchAndParseCsv();
    }, [tradesUrl, propSymbol, broker]);

    if (loading) {
        return <div className="loading-csv">Loading trade data...</div>;
    }

    if (error) {
        return <div className="error-message">Error loading trade data: {error}</div>;
    }

    if (tradeData.length === 0) {
        return (<div className="no-data">
                No trade data available {symbol ? `for ${symbol}` : ''}
                {broker !== 'Unknown' ? ` with broker ${broker}` : ''}
            </div>);
    }

    const displayBroker = broker !== 'Unknown' ? broker : '';

    return (<div className="trades-table-container">
            <h3>
                {symbol} Trade Data
                {displayBroker && ` for ${displayBroker}`}
                {' '}({tradeData.length} records)
            </h3>

            <table className="trades-table">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Trader ID</th>
                    <th>Broker</th>
                    <th>Day of Week</th>
                    <th>Hour of Day</th>
                    <th>Stop</th>
                    <th>Limit</th>
                    <th>Tick Offset</th>
                    <th>Trade Duration</th>
                    <th>Out of Time</th>
                </tr>
                </thead>
                <tbody>
                {tradeData.map((trade, index) => (<tr key={index}>
                        <td>{index + 1}</td>
                        <td>{trade.traderid}</td>
                        <td>{trade.broker || broker}</td>
                        <td>{trade.dayofweek}</td>
                        <td>{trade.hourofday}</td>
                        <td>{trade.stop}</td>
                        <td>{trade.limit}</td>
                        <td>{trade.tickoffset}</td>
                        <td>{trade.tradeduration}</td>
                        <td>{trade.outoftime}</td>
                    <td>
                        <Button onClick={() => handleDeleteRow(index)}>
                            Delete Item
                        </Button>

                    </td>

                </tr>))}
                </tbody>
            </table>
            {deleteConfirmOpen && (
                <View
                    position="fixed"
                    top="0"
                    left="0"
                    width="100%"
                    height="100%"
                    backgroundColor="rgba(0, 0, 0, 0.5)"
                    style={{
                        zIndex: 999,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                >
                    <Card
                        padding="2rem"
                        width="400px"
                        backgroundColor="white"
                        boxShadow="0px 4px 12px rgba(0, 0, 0, 0.15)"
                        borderRadius="8px"
                        style={{ // Add the style prop
                            opacity: 1 // Explicitly set opacity to 1 (fully opaque) here
                            // You could even try '1 !important' for testing, but avoid !important in production if possible
                        }}
                    >
                        <Heading level={4}>Confirm Delete</Heading>
                        <Text>
                            Are you sure you want to delete this trade setup? This action cannot be undone.
                        </Text>
                        <Flex justifyContent="flex-end" gap="0.5rem" marginTop="1rem">
                            <Button onClick={() => setDeleteConfirmOpen(false)}>
                                Cancel
                            </Button>
                            <Button variation="destructive" onClick={confirmDelete}>
                                Delete
                            </Button>
                        </Flex>
                    </Card>
                </View>
            )}
        </div>
    );

};

export default TradesTable;