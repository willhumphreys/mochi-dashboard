// src/StockTreeView.tsx
import {useEffect, useState} from "react";
import Papa from "papaparse";
import {AggregatedSummaryRow, FilteredSetupRow, MergedData} from "./types";
import {fetchStockSymbols, getDirectS3Url, getS3ImageUrl} from "./services/S3Service";

interface StockTreeViewProps {
    onRowSelect: (row: MergedData) => void;
    onSymbolSelect: (symbol: string | null) => void;
}

interface StockData {
    symbol: string;
    isExpanded: boolean;
    data: MergedData[];
    isLoading: boolean;
    error: string | null;
}

const StockTreeView = ({onRowSelect, onSymbolSelect}: StockTreeViewProps) => {
    const [stocksData, setStocksData] = useState<Record<string, StockData>>({});
    const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);
    const [symbolsError, setSymbolsError] = useState<string | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    useEffect(() => {
        // Fetch available stock symbols from S3 bucket using the service
        const initializeStockData = async () => {
            try {
                setIsLoadingSymbols(true);
                setSymbolsError(null);

                const stockSymbols = await fetchStockSymbols();

                console.log("Available stock symbols:", stockSymbols);

                if (stockSymbols.length === 0) {
                    setSymbolsError("No stock symbols found in the bucket");
                    return;
                }

                // Initialize the stocks data structure with fetched symbols
                const initialStocksData: Record<string, StockData> = {};
                stockSymbols.forEach(symbol => {
                    initialStocksData[symbol] = {
                        symbol, isExpanded: false, data: [], isLoading: false, error: null
                    };
                });

                setStocksData(initialStocksData);

            } catch (error) {
                console.error("Error initializing stock data:", error);
                setSymbolsError(error instanceof Error ? error.message : String(error));
            } finally {
                setIsLoadingSymbols(false);
            }
        };

        initializeStockData();
    }, []);


    const handleSymbolClick = (symbol: string) => {
        // Set selected symbol locally
        setSelectedSymbol(symbol);

        // Notify parent component
        onSymbolSelect(symbol);

        console.log("Symbol selected:", symbol);
    };




    const toggleSymbol = async (symbol: string) => {
        // Toggle expansion state
        setStocksData(prevData => ({
            ...prevData,
            [symbol]: {
                ...prevData[symbol],
                isExpanded: !prevData[symbol].isExpanded
            }
        }));

        // If we're expanding and no data is loaded yet, load the data
        if (!stocksData[symbol].isExpanded && stocksData[symbol].data.length === 0) {
            await loadStockData(symbol);
        }
    };


    const loadStockData = async (symbol: string) => {
        try {
            // Set loading state
            setStocksData(prevData => ({
                ...prevData, [symbol]: {
                    ...prevData[symbol], isLoading: true, error: null
                }
            }));

            // Define the S3 paths for the CSV files based on the symbol
            const filteredSetupsKey = `${symbol}_polygon_min/filtered-setups.csv`;
            const aggregatedSummaryKey = `${symbol}_polygon_min/aggregated_filtered_summary.csv`;

            // Get URLs for both CSV files
            let filteredSetupsUrl: string;
            let aggregatedSummaryUrl: string;

            try {
                // Try to get pre-signed URLs first
                filteredSetupsUrl = await getS3ImageUrl(filteredSetupsKey);
                aggregatedSummaryUrl = await getS3ImageUrl(aggregatedSummaryKey);
            } catch (error) {
                console.error(`Failed to get pre-signed URLs for ${symbol}, falling back to direct URLs:`, error);
                filteredSetupsUrl = getDirectS3Url(filteredSetupsKey);
                aggregatedSummaryUrl = getDirectS3Url(aggregatedSummaryKey);
            }

            // Fetch the CSV data using the generated URLs
            const [filteredSetupsResponse, aggregatedSummaryResponse] = await Promise.all([fetch(filteredSetupsUrl), fetch(aggregatedSummaryUrl)]);

            if (!filteredSetupsResponse.ok) {
                throw new Error(`Failed to fetch filtered-setups.csv for ${symbol}: ${filteredSetupsResponse.statusText}`);
            }

            if (!aggregatedSummaryResponse.ok) {
                throw new Error(`Failed to fetch aggregated_filtered_summary.csv for ${symbol}: ${aggregatedSummaryResponse.statusText}`);
            }

            const filteredSetupsText = await filteredSetupsResponse.text();
            const aggregatedSummaryText = await aggregatedSummaryResponse.text();

            // Parse the CSV data
            const filteredSetupsData = Papa.parse<FilteredSetupRow>(filteredSetupsText, {
                header: true, skipEmptyLines: true,
            }).data;

            const aggregatedSummaryData = Papa.parse<AggregatedSummaryRow>(aggregatedSummaryText, {
                header: true, skipEmptyLines: true,
            }).data;

            console.log(`${symbol} filtered setups data:`, filteredSetupsData.length, "rows");
            console.log(`${symbol} aggregated summary data:`, aggregatedSummaryData.length, "rows");

            // Merge the data
            const mergedData = filteredSetupsData.map((setupRow) => {
                const summaryRow = aggregatedSummaryData.find((sr) => sr.Rank === setupRow.Rank);
                return {
                    Rank: setupRow.Rank,
                    Scenario: summaryRow?.Scenario || "N/A",
                    TraderID: summaryRow?.TraderID || 0,
                    MaxDrawdown: summaryRow?.MaxDrawdown || 0,
                    MaxProfit: summaryRow?.MaxProfit || 0,
                    ProfitFactor: summaryRow?.ProfitFactor || 0,
                    CompositeScore: summaryRow?.CompositeScore || 0,
                    RiskRewardBalance: summaryRow?.RiskRewardBalance || 0,
                    Setup: `${setupRow.dayofweek},${setupRow.hourofday},${setupRow.stop},${setupRow.limit},${setupRow.tickoffset},${setupRow.tradeduration},${setupRow.outoftime}`,
                    totalprofit: setupRow.totalprofit,
                    tradecount: setupRow.tradecount,
                    besttrade: setupRow.besttrade,
                    worsttrade: setupRow.worsttrade,
                    profit_stddev: setupRow.profit_stddev,
                    wincount: setupRow.wincount,
                    losecount: setupRow.losecount,
                    winningticks: setupRow.winningticks,
                    losingticks: setupRow.losingticks,
                    averagenetprofit: setupRow.averagenetprofit,
                    winningyears: setupRow.winningyears,
                    dayofweek: setupRow.dayofweek,
                    hourofday: setupRow.hourofday,
                    stop: setupRow.stop,
                    limit: setupRow.limit,
                    tickoffset: setupRow.tickoffset,
                    tradeduration: setupRow.tradeduration,
                    outoftime: setupRow.outoftime,
                    averagewinner: setupRow.averagewinner,
                    averageloser: setupRow.averageloser,
                    reward_risk_ratio: setupRow.reward_risk_ratio,
                    cte_win_loss_ratio: setupRow.cte_win_loss_ratio,
                    winnerprobability: setupRow.winnerprobability,
                    loserprobability: setupRow.loserprobability,
                    endurance_rank: setupRow.endurance_rank,
                    pain_tolerance_rank: setupRow.pain_tolerance_rank,
                    trend_reversal_rank: setupRow.trend_reversal_rank,
                    appt: setupRow.appt,
                    sharpe_ratio: setupRow.sharpe_ratio,
                    modified_sharpe_ratio: setupRow.modified_sharpe_ratio,
                    profit_to_max_drawdown_ratio: setupRow.profit_to_max_drawdown_ratio,
                    profit_to_risk_ratio: setupRow.profit_to_risk_ratio,
                    profit_factor: setupRow.profit_factor,
                    Symbol: symbol,
                    kelly_fraction: setupRow.kelly_fraction,
                    coefficient_of_variation: setupRow.coefficient_of_variation,
                    sortino_ratio: setupRow.sortino_ratio,
                    profit_per_risk_ratio: setupRow.profit_per_risk_ratio,
                    calmar_ratio: setupRow.calmar_ratio,
                    recovery_factor: setupRow.recovery_factor,
                    sterling_ratio: setupRow.sterling_ratio,
                    max_drawdown_percentage: setupRow.max_drawdown_percentage,
                    avg_profit_to_max_drawdown: setupRow.avg_profit_to_max_drawdown,
                    max_drawdown_duration: setupRow.max_drawdown_duration,
                    ulcer_index: setupRow.ulcer_index,
                    pain_index: setupRow.pain_index,
                    martin_ratio: setupRow.martin_ratio,
                    drawdown_events_count: setupRow.drawdown_events_count,
                    max_melt_up: setupRow.max_melt_up,
                    max_melt_up_duration: setupRow.max_melt_up_duration,
                    max_melt_up_percentage: setupRow.max_melt_up_percentage,
                    melt_up_events_count: setupRow.melt_up_events_count,
                    avg_melt_up: setupRow.avg_melt_up,
                    max_consecutive_winners: setupRow.max_consecutive_winners,
                    avg_consecutive_winners: setupRow.avg_consecutive_winners,
                    max_consecutive_losers: setupRow.max_consecutive_losers,
                    avg_consecutive_losers: setupRow.avg_consecutive_losers,
                    max_drawdown: setupRow.max_drawdown,
                    profitColumn: setupRow.profitColumn,
                    hourDay: setupRow.hourDay

                } as MergedData;
            });

            // Update state with the loaded data
            setStocksData(prevData => ({
                ...prevData, [symbol]: {
                    ...prevData[symbol], isLoading: false, data: mergedData,
                }
            }));

        } catch (error) {
            console.error(`Error loading data for ${symbol}:`, error);
            setStocksData(prevData => ({
                ...prevData, [symbol]: {
                    ...prevData[symbol], isLoading: false, error: error instanceof Error ? error.message : String(error)
                }
            }));
        }
    };

    if (isLoadingSymbols) {
        return <div className="loading">Loading available stock symbols...</div>;
    }

    if (symbolsError) {
        return <div className="error">Error: {symbolsError}</div>;
    }


    return (
        <div className="stock-tree-view">
            <h3>Available Stocks</h3>
            <div className="stocks-container">
                {Object.keys(stocksData).map(symbol => (
                    <div key={symbol} className="stock-item">
                        <div
                            className={`stock-header ${selectedSymbol === symbol ? 'selected' : ''}`}
                        >
                        <span
                            className="toggle-icon"
                            onClick={() => toggleSymbol(symbol)}
                        >
                            {stocksData[symbol].isExpanded ? '▼' : '▶'}
                        </span>
                            <span
                                className="stock-symbol"
                                onClick={() => handleSymbolClick(symbol)}
                            >
                            {symbol}
                        </span>
                        </div>

                        {stocksData[symbol].isExpanded && (
                            <div className="stock-details">
                                {stocksData[symbol].isLoading ? (
                                    <div className="status-message">Loading data for {symbol}...</div>
                                ) : stocksData[symbol].error ? (
                                    <div className="status-message error">Error: {stocksData[symbol].error}</div>
                                ) : stocksData[symbol].data.length === 0 ? (
                                    <div className="status-message">No data available for {symbol}</div>
                                ) : (
                                    <div className="scenarios-container">
                                        {stocksData[symbol].data.map((row, index) => (
                                            <div
                                                key={index}
                                                onClick={() => onRowSelect(row)}
                                                className="scenario-item"
                                            >
                                                {row.Scenario} (Rank: {row.Rank})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

    );
};

export default StockTreeView;
