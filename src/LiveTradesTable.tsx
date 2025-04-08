// src/components/TradesTable.tsx
import { useEffect, useState } from 'react';
import { TradeData } from './types';
import {LIVE_TRADES_BUCKET_NAME, readCsvFromS3} from "./services/S3Service.ts";

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

                // Extract key from tradesUrl
                // Assuming tradesUrl is in the format: https://bucket-name.s3.region.amazonaws.com/key
                // or just a direct key path
                let s3Key = tradesUrl;
                if (tradesUrl.includes('amazonaws.com')) {
                    const urlParts = tradesUrl.split('/');
                    // Extract the key by removing the domain part
                    s3Key = urlParts.slice(3).join('/');
                }

                // Use the existing readCsvFromS3 function to fetch and parse the data
                const parsedData = await readCsvFromS3<Record<string, string | number | boolean | undefined>>(LIVE_TRADES_BUCKET_NAME, s3Key);

                // Process parsed data to ensure all required fields with proper types
                const processedData: TradeData[] = parsedData.map(row => {
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
        return (
            <div className="no-data">
                No trade data available {symbol ? `for ${symbol}` : ''}
                {broker !== 'Unknown' ? ` with broker ${broker}` : ''}
            </div>
        );
    }

    const displayBroker = broker !== 'Unknown' ? broker : '';

    return (
        <div className="trades-table-container">
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
                {tradeData.map((trade, index) => (
                    <tr key={index}>
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
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default TradesTable;