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
    PriceCrossed: boolean;
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
    const [copied, setCopied] = useState<boolean>(false); // State for copy confirmation

    // Define styles for positive and negative profits
    const profitStyle = { color: '#00b300' }; // Green color
    const lossStyle = { color: '#ff0000' };   // Red color

    // Helper function to format numbers with commas and fixed decimal places
    const formatProfit = (value: number | undefined | null): string => {
        if (value === undefined || value === null || isNaN(Number(value))) {
            return "N/A";
        }
        return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

                console.log("Fetching CSV AAA from URL:", tradesUrl);

                let csvData: Record<string, string | number | boolean | undefined>[];

                if (tradesUrl.includes('amazonaws.com')) {
                    let bucketName: string;
                    let objectKey: string;

                    try {
                        const url = new URL(tradesUrl);
                        const hostParts = url.hostname.split('.');

                        if (hostParts[0].endsWith('-s3') || hostParts[1] === 's3') {
                            bucketName = hostParts[0];
                            objectKey = url.pathname.substring(1);
                        } else if (hostParts[0] === 's3') {
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

                    const signedUrl = await getSignedS3Url(bucketName, objectKey, 900);
                    const response = await fetch(signedUrl);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
                    }

                    const csvContent = await response.text();
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
                    const s3Key = tradesUrl;
                    csvData = await readCsvFromS3WithSignedUrl<Record<string, string | number | boolean | undefined>>(
                        LIVE_TRADES_BUCKET_NAME,
                        s3Key,
                        {
                            expiresIn: 900,
                            parseOptions: {
                                header: true,
                                dynamicTyping: true,
                                skipEmptyLines: true
                            }
                        }
                    );
                }

                const processedData: TradeResultData[] = csvData.map(row => {
                    const safeParseFloat = (value: unknown, defaultValue: number = 0): number => {
                        if (typeof value === 'number') return value;
                        if (typeof value === 'string') return parseFloat(value) || defaultValue;
                        return defaultValue;
                    };
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
                        State: safeString(row.State),
                        PriceCrossed: row.PriceCrossed === 'True' || row.PriceCrossed === true
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

    const handleCopyToCsv = () => {
        if (tradeData.length === 0) {
            return;
        }

        const headers = ["Date/Time", "Entry Price", "Exit Price", "Profit", "Running Total", "Exit Reason", "Valid"];
        const dataForCsv = tradeData.map(trade => ({
            "Date/Time": trade.PlaceDateTime,
            "Entry Price": trade.FilledPrice.toFixed(2),
            "Exit Price": trade.ClosingPrice.toFixed(2),
            "Profit": trade.Profit.toFixed(2),
            "Running Total": trade.RunningTotalProfit.toFixed(2),
            "Exit Reason": trade.State,
            "Valid": trade.PriceCrossed ? 'True' : 'False'
        }));

        const csvString = Papa.unparse({
            fields: headers,
            data: dataForCsv
        });

        navigator.clipboard.writeText(csvString)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Hide message after 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy CSV: ', err);
                // You could set an error message here if needed
            });
    };

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

    // Calculate additional stats
    let loserCount = 0;
    let loserFollowedByLoserCount = 0;
    let loserFollowedByTwoLosersCount = 0;
    let profitSkippingNextAfterLoser = 0;
    let profitSkippingNextTwoAfterLoser = 0;


    if (tradeData.length > 0) {
        for (let i = 0; i < tradeData.length; i++) {
            const currentTrade = tradeData[i];
            const currentProfit = currentTrade.Profit;

            if (currentProfit < 0) {
                loserCount++;
                if (i + 1 < tradeData.length && tradeData[i + 1].Profit < 0) {
                    loserFollowedByLoserCount++;
                    if (i + 2 < tradeData.length && tradeData[i + 2].Profit < 0) {
                        loserFollowedByTwoLosersCount++;
                    }
                }
            }

            // Calculate profit if skipping the trade after a loser
            let includeInNextAfterLoserSkipped = true;
            if (i > 0 && tradeData[i-1].Profit < 0) {
                includeInNextAfterLoserSkipped = false;
            }
            if (includeInNextAfterLoserSkipped) {
                profitSkippingNextAfterLoser += currentProfit;
            }

            // Calculate profit if skipping the next two trades after a loser
            let includeInNextTwoAfterLoserSkipped = true;
            if (i > 0 && tradeData[i-1].Profit < 0) { // Previous was a loser, skip current
                includeInNextTwoAfterLoserSkipped = false;
            } else if (i > 1 && tradeData[i-2].Profit < 0) { // Two trades ago was a loser, skip current (it's the 2nd trade after that loser)
                includeInNextTwoAfterLoserSkipped = false;
            }
            if (includeInNextTwoAfterLoserSkipped) {
                profitSkippingNextTwoAfterLoser += currentProfit;
            }
        }
    }

    const oddsNextIsLoser = loserCount > 0 ? (loserFollowedByLoserCount / loserCount) * 100 : 0;
    const oddsNextTwoAreLosers = loserCount > 0 ? (loserFollowedByTwoLosersCount / loserCount) * 100 : 0;
    const averageProfitPerTradeValue = tradeData.length > 0 ? totalProfit / tradeData.length : 0;


    return (
        <div className="trades-table-container">
            <h3>{symbol} Trade Results {datasource ? `(${datasource})` : ''}</h3>

            <div className="summary">
                <p>Total trades: {tradeData.length}</p>
                <p>Total profit: <span style={totalProfit >= 0 ? profitStyle : lossStyle}>
                    {formatProfit(totalProfit)}
                </span></p>
                <p>Average profit per trade: <span style={averageProfitPerTradeValue >= 0 ? profitStyle : lossStyle}>
                    {tradeData.length > 0 ? formatProfit(averageProfitPerTradeValue) : 'N/A'}
                </span></p>
                <p>
                    Odds next trade is loser (given current is loser): {loserCount > 0 ? `${oddsNextIsLoser.toFixed(2)}%` : 'N/A'}
                </p>
                <p>
                    Odds next two trades are losers (given current is loser): {loserCount > 0 ? `${oddsNextTwoAreLosers.toFixed(2)}%` : 'N/A'}
                </p>
                <p>
                    Profit if skipping 1 trade after a loser: <span style={profitSkippingNextAfterLoser >= 0 ? profitStyle : lossStyle}>
                        {formatProfit(profitSkippingNextAfterLoser)}
                    </span>
                </p>
                <p>
                    Profit if skipping 2 trades after a loser: <span style={profitSkippingNextTwoAfterLoser >= 0 ? profitStyle : lossStyle}>
                        {formatProfit(profitSkippingNextTwoAfterLoser)}
                    </span>
                </p>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <button onClick={handleCopyToCsv} disabled={tradeData.length === 0}>
                    Copy Table as CSV
                </button>
                {copied && <span style={{ marginLeft: '10px', color: 'green' }}>Copied to clipboard!</span>}
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
                    <th>Valid</th>
                </tr>
                </thead>
                <tbody>
                {tradeData.map((trade, index) => (
                    <tr key={index}>
                        <td>{trade.PlaceDateTime}</td>
                        <td>{trade.FilledPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{trade.ClosingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={trade.Profit >= 0 ? profitStyle : lossStyle}>
                            {formatProfit(trade.Profit)}
                        </td>
                        <td style={trade.RunningTotalProfit >= 0 ? profitStyle : lossStyle}>
                            {formatProfit(trade.RunningTotalProfit)}
                        </td>
                        <td>{trade.State}</td>
                        <td>{trade.PriceCrossed ? '✅' : '❌'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};