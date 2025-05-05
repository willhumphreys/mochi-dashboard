import { useEffect, useState } from "react";
import { MergedData, TraderConfigDetails } from "./types";
import { getS3ImageUrl, getDirectS3Url } from "./services/S3Service";
import { TradesTable2 } from "./TradesTable2";

// Add to imports
import { getSymbolFolderName, getSymbolFilePrefix } from "./config/datasourceConfig";

interface StrategyVisualizationProps {
    selectedStrategy: MergedData | null;
    datasource?: string; // New prop
}

const StrategyVisualization = (
    { selectedStrategy,  datasource }: StrategyVisualizationProps) => {const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [tradesUrl, setTradesUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [usedDirectUrl, setUsedDirectUrl] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState(false);


    // Add state for trader configuration
    const [, setTraderConfig] = useState<TraderConfigDetails>({
        rank: 0,
        dayofweek: 0,
        hourofday: 0,
        stop: 0,
        limit: 0,
        tickoffset: 0,
        tradeduration: 0,
        outoftime: 0,
        // Initialize performance metrics
        totalprofit: 0,
        tradecount: 0,
        wincount: 0,
        losecount: 0,
        besttrade: 0,
        worsttrade: 0,
        ProfitFactor: 0,
        averagenetprofit: 0,
        MaxProfit: 0,
        MaxDrawdown: 0,
        stopped_trade_count: 0,
        limit_trade_count: 0
    });

    const copySetupToClipboard = async () => {
        if (selectedStrategy?.Setup) {
            try {
                await navigator.clipboard.writeText(selectedStrategy.Setup);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 1500);
            } catch (err) {
                console.error("Failed to copy setup value: ", err);
            }
        }
    };


    // State management handled directly in the fetchTraderConfig function

    // Format number function to handle undefined/null values
    const formatNumber = (value: number | undefined | null, decimals: number = 2): string => {
        if (value === undefined || value === null) return "N/A";

        const numValue = Number(value);

        if (isNaN(numValue)) return "N/A";

        // Check if it's an integer
        if (Number.isInteger(numValue)) {
            return numValue.toString();
        } else {
            // It's a float, so apply decimal formatting
            return numValue.toFixed(decimals);
        }
    };

    const formatPercent = (value: number | undefined | null, decimals: number = 2): string => {
        if (value === undefined || value === null) return "N/A";

        const numValue = Number(value) * 100;

        if (isNaN(numValue)) return "N/A";

        // Check if it's an integer after converting to percentage
        if (Number.isInteger(numValue)) {
            return `${numValue}%`;
        } else {
            // It's a float, so apply decimal formatting
            return `${numValue.toFixed(decimals)}%`;
        }
    };

    useEffect(() => {
        // Reset state when strategy changes
        setImageUrl(null);
        setTradesUrl(null);
        setLoading(false);
        setError(null);
        setUsedDirectUrl(false);

        if (!selectedStrategy) {
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load graph image
                const graphKey = constructGraphS3Key(selectedStrategy);
                if (graphKey) {
                    console.log("Constructed graph S3 key:", graphKey);
                    try {
                        // First try with pre-signed URL
                        const url = await getS3ImageUrl(graphKey);
                        setImageUrl(url);
                    } catch (presignError) {
                        console.error("Failed to get pre-signed URL:", presignError);
                        // Fallback: Try direct URL if pre-signed URL fails
                        console.log("Falling back to direct S3 URL...");
                        const directUrl = getDirectS3Url(graphKey);
                        setImageUrl(directUrl);
                        setUsedDirectUrl(true);
                    }
                }

                // Load trades CSV
                const tradesKey = constructTradeS3Key(selectedStrategy);
                if (tradesKey) {
                    console.log("Constructed trades S3 key:", tradesKey);
                    try {
                        // First try with pre-signed URL
                        const url = await getS3ImageUrl(tradesKey);
                        setTradesUrl(url);
                    } catch (presignError) {
                        console.error("Failed to get pre-signed URL for trades:", presignError);
                        // Fallback: Try direct URL if pre-signed URL fails
                        console.log("Falling back to direct S3 URL for trades...");
                        const directUrl = getDirectS3Url(tradesKey);
                        setTradesUrl(directUrl);
                    }
                }
            } catch (err) {
                console.error("Failed to load strategy data:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Add logic to fetch trader configuration
        const fetchTraderConfig = async () => {
            if (!selectedStrategy) return;

            try {
                // In a real application, you would fetch this data from an API
                // For now, we'll use the data from the selectedStrategy
                const config: TraderConfigDetails = {
                    rank: selectedStrategy.Rank,
                    dayofweek: selectedStrategy.dayofweek || 0,
                    hourofday: selectedStrategy.hourofday || 0,
                    stop: selectedStrategy.stop || 0,
                    limit: selectedStrategy.limit || 0,
                    tickoffset: selectedStrategy.tickoffset || 0,
                    tradeduration: selectedStrategy.tradeduration || 0,
                    outoftime: selectedStrategy.outoftime || 0,
                    // Add performance metrics
                    totalprofit: selectedStrategy.totalprofit,
                    tradecount: selectedStrategy.tradecount,
                    wincount: selectedStrategy.wincount,
                    losecount: selectedStrategy.losecount,
                    besttrade: selectedStrategy.besttrade,
                    worsttrade: selectedStrategy.worsttrade,
                    ProfitFactor: selectedStrategy.ProfitFactor,
                    averagenetprofit: selectedStrategy.averagenetprofit,
                    MaxProfit: selectedStrategy.MaxProfit,
                    MaxDrawdown: selectedStrategy.MaxDrawdown,
                    stopped_trade_count: selectedStrategy.stopped_trade_count,
                    limit_trade_count: selectedStrategy.limit_trade_count
                };

                setTraderConfig(config);
            } catch (err) {
                console.error("Failed to fetch trader configuration:", err);
            }
        };

        fetchTraderConfig();
    }, [selectedStrategy]);

    // Update your key construction functions
    const constructGraphS3Key = (strategy: MergedData): string | null => {
        if (!strategy || !strategy.Symbol) return null;

        // Use the helper function to get the folder name with datasource
        const symbolFolder = getSymbolFolderName(strategy.Symbol, datasource);

        return `${symbolFolder}/graphs/${symbolFolder}_${strategy.Scenario}_${strategy.TraderID}.png`;
    };


    const constructTradeS3Key = (strategy: MergedData): string | null => {
        if (!strategy || !strategy.Symbol) return null;

        // Use the helper function to get the folder name with datasource
        const symbolFolder = getSymbolFolderName(strategy.Symbol, datasource);

        // Use the helper function to get the file prefix with datasource
        const filePrefix = getSymbolFilePrefix(strategy.Symbol, datasource);

        // Use the pre-existing scenario string instead of constructing it
        // Assuming strategy.scenarioString contains the full parameter string
        const scenarioString = strategy.Scenario;

        // Return the constructed key with the trader ID
        return `${symbolFolder}/trades/${filePrefix}_${scenarioString}_${strategy.TraderID}.csv`;
    };

// Keep your existing URL construction pattern but just add the datasource properly
    if (!selectedStrategy) {
        return <div className="strategy-placeholder">Select a strategy to view details</div>;
    }


    return (
        <div className="strategy-visualization">
            <h3>Strategy {selectedStrategy.Scenario} (Trader {selectedStrategy.TraderID})</h3>

            <div className="strategy-tables-container">
                {/* Basic Information */}
                <div className="strategy-table-section">
                    <h4>Basic Information</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Rank</th>
                            <td>{selectedStrategy.Rank}</td>
                            <th>Symbol</th>
                            <td>{selectedStrategy.Symbol}</td>
                        </tr>
                        <tr>
                            <th>Scenario</th>
                            <td>{selectedStrategy.Scenario}</td>
                            <th>Trader ID</th>
                            <td>{selectedStrategy.TraderID}</td>
                        </tr>
                        <tr>
                            <th>Setup</th>
                            <td colSpan={3}>
                                {selectedStrategy.Setup}
                                <button
                                    onClick={copySetupToClipboard}
                                    className="copy-button"
                                    title="Copy setup value"
                                    style={{
                                        marginLeft: '8px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {copySuccess ? '✓' : '📋'}
                                </button>
                            </td>
                        </tr>

                        </tbody>
                    </table>
                </div>

                {/* Performance Summary */}
                <div className="strategy-table-section">
                    <h4>Performance Summary</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Total Profit</th>
                            <td>{formatNumber(selectedStrategy.totalprofit)}</td>
                            <th>Trade Count</th>
                            <td>{selectedStrategy.tradecount}</td>
                        </tr>
                        <tr>
                            <th>Win Count</th>
                            <td>{selectedStrategy.wincount}</td>
                            <th>Loss Count</th>
                            <td>{selectedStrategy.losecount}</td>
                        </tr>
                        <tr>
                            <th>Best Trade</th>
                            <td>{formatNumber(selectedStrategy.besttrade)}</td>
                            <th>Worst Trade</th>
                            <td>{formatNumber(selectedStrategy.worsttrade)}</td>
                        </tr>
                        <tr>
                            <th>Profit Factor</th>
                            <td>{formatNumber(selectedStrategy.ProfitFactor)}</td>
                            <th>Avg. Net Profit</th>
                            <td>{formatNumber(selectedStrategy.averagenetprofit)}</td>
                        </tr>
                        <tr>
                            <th>Max Profit</th>
                            <td>{formatNumber(selectedStrategy.MaxProfit)}</td>
                            <th>Max Drawdown</th>
                            <td>{formatNumber(selectedStrategy.MaxDrawdown)}</td>
                        </tr>
                        <tr>
                            <th>Stopped Count</th>
                            <td>{selectedStrategy.stopped_trade_count}</td>
                            <th>Limit Count</th>
                            <td>{selectedStrategy.limit_trade_count}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Risk Metrics */}
                <div className="strategy-table-section">
                    <h4>Risk Metrics</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Risk/Reward Balance</th>
                            <td>{formatNumber(selectedStrategy.RiskRewardBalance)}</td>
                            <th>Reward/Risk Ratio</th>
                            <td>{formatNumber(selectedStrategy.reward_risk_ratio)}</td>
                        </tr>
                        <tr>
                            <th>Max Drawdown %</th>
                            <td>{formatPercent(selectedStrategy.max_drawdown_percentage)}</td>
                            <th>Max Drawdown Duration</th>
                            <td>{selectedStrategy.max_drawdown_duration}</td>
                        </tr>
                        <tr>
                            <th>Profit to Max Drawdown</th>
                            <td>{formatNumber(selectedStrategy.profit_to_max_drawdown_ratio)}</td>
                            <th>Profit to Risk Ratio</th>
                            <td>{formatNumber(selectedStrategy.profit_to_risk_ratio)}</td>
                        </tr>
                        <tr>
                            <th>Profit per Risk</th>
                            <td>{formatNumber(selectedStrategy.profit_per_risk_ratio)}</td>
                            <th>Drawdown Events</th>
                            <td>{selectedStrategy.drawdown_events_count}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Statistical Metrics */}
                <div className="strategy-table-section">
                    <h4>Statistical Metrics</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Sharpe Ratio</th>
                            <td>{formatNumber(selectedStrategy.sharpe_ratio)}</td>
                            <th>Modified Sharpe</th>
                            <td>{formatNumber(selectedStrategy.modified_sharpe_ratio)}</td>
                        </tr>
                        <tr>
                            <th>Sortino Ratio</th>
                            <td>{formatNumber(selectedStrategy.sortino_ratio)}</td>
                            <th>Calmar Ratio</th>
                            <td>{formatNumber(selectedStrategy.calmar_ratio)}</td>
                        </tr>
                        <tr>
                            <th>Sterling Ratio</th>
                            <td>{formatNumber(selectedStrategy.sterling_ratio)}</td>
                            <th>Martin Ratio</th>
                            <td>{formatNumber(selectedStrategy.martin_ratio)}</td>
                        </tr>
                        <tr>
                            <th>Recovery Factor</th>
                            <td>{formatNumber(selectedStrategy.recovery_factor)}</td>
                            <th>Ulcer Index</th>
                            <td>{formatNumber(selectedStrategy.ulcer_index)}</td>
                        </tr>
                        <tr>
                            <th>Pain Index</th>
                            <td>{formatNumber(selectedStrategy.pain_index)}</td>
                            <th>Kelly Fraction</th>
                            <td>{formatNumber(selectedStrategy.kelly_fraction)}</td>
                        </tr>
                        <tr>
                            <th>Coef of Variation</th>
                            <td>{formatNumber(selectedStrategy.coefficient_of_variation)}</td>
                            <th>Profit Std Dev</th>
                            <td>{formatNumber(selectedStrategy.profit_stddev)}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Trade Metrics */}
                <div className="strategy-table-section">
                    <h4>Trade Metrics</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Avg Winner</th>
                            <td>{formatNumber(selectedStrategy.averagewinner)}</td>
                            <th>Avg Loser</th>
                            <td>{formatNumber(selectedStrategy.averageloser)}</td>
                        </tr>
                        <tr>
                            <th>Win Probability</th>
                            <td>{formatPercent(selectedStrategy.winnerprobability)}</td>
                            <th>Loss Probability</th>
                            <td>{formatPercent(selectedStrategy.loserprobability)}</td>
                        </tr>
                        <tr>
                            <th>CTE Win/Loss Ratio</th>
                            <td>{formatNumber(selectedStrategy.cte_win_loss_ratio)}</td>
                            <th>Winning Ticks</th>
                            <td>{selectedStrategy.winningticks}</td>
                        </tr>
                        <tr>
                            <th>Losing Ticks</th>
                            <td>{selectedStrategy.losingticks}</td>
                            <th>Winning Years</th>
                            <td>{selectedStrategy.winningyears}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Trade Sequences */}
                <div className="strategy-table-section">
                    <h4>Trade Sequences</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Max Consecutive Winners</th>
                            <td>{selectedStrategy.max_consecutive_winners}</td>
                            <th>Avg Consecutive Winners</th>
                            <td>{formatNumber(selectedStrategy.avg_consecutive_winners)}</td>
                        </tr>
                        <tr>
                            <th>Max Consecutive Losers</th>
                            <td>{selectedStrategy.max_consecutive_losers}</td>
                            <th>Avg Consecutive Losers</th>
                            <td>{formatNumber(selectedStrategy.avg_consecutive_losers)}</td>
                        </tr>
                        <tr>
                            <th>Max Melt Up</th>
                            <td>{formatNumber(selectedStrategy.max_melt_up)}</td>
                            <th>Max Melt Up %</th>
                            <td>{formatPercent(selectedStrategy.max_melt_up_percentage)}</td>
                        </tr>
                        <tr>
                            <th>Max Melt Up Duration</th>
                            <td>{selectedStrategy.max_melt_up_duration}</td>
                            <th>Melt Up Events</th>
                            <td>{selectedStrategy.melt_up_events_count}</td>
                        </tr>
                        <tr>
                            <th>Avg Melt Up</th>
                            <td>{formatNumber(selectedStrategy.avg_melt_up)}</td>
                            <th>APPT</th>
                            <td>{formatNumber(selectedStrategy.appt)}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Trading Configuration */}
                <div className="strategy-table-section">
                    <h4>Trading Configuration</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Day of Week</th>
                            <td>{selectedStrategy.dayofweek}</td>
                            <th>Hour of Day</th>
                            <td>{selectedStrategy.hourofday}</td>
                        </tr>
                        <tr>
                            <th>Stop</th>
                            <td>{selectedStrategy.stop}</td>
                            <th>Limit</th>
                            <td>{selectedStrategy.limit}</td>
                        </tr>
                        <tr>
                            <th>Tick Offset</th>
                            <td>{selectedStrategy.tickoffset}</td>
                            <th>Trade Duration</th>
                            <td>{selectedStrategy.tradeduration}</td>
                        </tr>
                        <tr>
                            <th>Out of Time</th>
                            <td>{selectedStrategy.outoftime}</td>
                            <th></th>
                            <td></td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Rank Metrics */}
                <div className="strategy-table-section">
                    <h4>Rank Metrics</h4>
                    <table className="strategy-data-table">
                        <tbody>
                        <tr>
                            <th>Composite Score</th>
                            <td>{formatNumber(selectedStrategy.CompositeScore)}</td>
                            <th>Endurance Rank</th>
                            <td>{selectedStrategy.endurance_rank}</td>
                        </tr>
                        <tr>
                            <th>Pain Tolerance Rank</th>
                            <td>{selectedStrategy.pain_tolerance_rank}</td>
                            <th>Trend Reversal Rank</th>
                            <td>{selectedStrategy.trend_reversal_rank}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Strategy Image */}
            <div className="strategy-image-container">
                {loading && <div className="loading-spinner">Loading strategy image...</div>}
                {error && <div className="error-message">Error loading image: {error}</div>}
                {imageUrl && !loading && (
                    <div>
                        <h4>Strategy Visualization</h4>
                        <img
                            src={imageUrl}
                            alt={`Strategy ${selectedStrategy.Scenario} visualization`}
                            className="strategy-chart"
                        />
                        {usedDirectUrl && (
                            <p className="image-source-note">
                                Note: Using direct S3 URL. Image may not load if the bucket isn't publicly accessible.
                            </p>
                        )}
                    </div>
                )}

                {tradesUrl && (
                    <TradesTable2
                        symbol={selectedStrategy?.Symbol}
                        tradesUrl={tradesUrl}
                        datasource={datasource}
                    />
                )}

            </div>
        </div>
    );
};

export default StrategyVisualization;
