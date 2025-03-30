// src/MergedTable.tsx
import {useEffect, useState} from "react";
import Papa from "papaparse";
import {AggregatedSummaryRow, FilteredSetupRow, MergedData} from "./types";
import {getDirectS3Url, getS3ImageUrl} from "./services/S3Service";

interface MergedTableProps {
    onRowSelect: (row: MergedData) => void;
}

const MergedTable = ({onRowSelect}: MergedTableProps) => {
    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleRowClick = (row: MergedData) => {
        onRowSelect(row);
    };

    useEffect(() => {
        const loadAndMergeData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Define the S3 paths for the CSV files
                const filteredSetupsKey = "AAPL_polygon_min/filtered-setups.csv";
                const aggregatedSummaryKey = "AAPL_polygon_min/aggregated_filtered_summary.csv";

                // Get URLs for both CSV files
                let filteredSetupsUrl: string;
                let aggregatedSummaryUrl: string;

                try {
                    // Try to get pre-signed URLs first
                    filteredSetupsUrl = await getS3ImageUrl(filteredSetupsKey);
                    aggregatedSummaryUrl = await getS3ImageUrl(aggregatedSummaryKey);
                } catch (error) {
                    console.error("Failed to get pre-signed URLs, falling back to direct URLs:", error);
                    filteredSetupsUrl = getDirectS3Url(filteredSetupsKey);
                    aggregatedSummaryUrl = getDirectS3Url(aggregatedSummaryKey);
                }

                // Fetch the CSV data using the generated URLs
                const [filteredSetupsResponse, aggregatedSummaryResponse] = await Promise.all([fetch(filteredSetupsUrl), fetch(aggregatedSummaryUrl)]);

                if (!filteredSetupsResponse.ok) {
                    throw new Error(`Failed to fetch filtered-setups.csv: ${filteredSetupsResponse.statusText}`);
                }

                if (!aggregatedSummaryResponse.ok) {
                    throw new Error(`Failed to fetch aggregated_filtered_summary.csv: ${aggregatedSummaryResponse.statusText}`);
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

                console.log("Filtered setups data:", filteredSetupsData.length, "rows");
                console.log("Aggregated summary data:", aggregatedSummaryData.length, "rows");

                // Update the data merging code
                const merged = filteredSetupsData.map((setupRow) => {
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
                        Setup: setupRow.Setup,
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
                        Symbol: "AAPL", // Adding the symbol
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

                    };
                });

                setMergedData(merged);
            } catch (err) {
                console.error("Error loading data:", err);
                setError(err instanceof Error ? err.message : "Unknown error loading data");
            } finally {
                setIsLoading(false);
            }
        };

        loadAndMergeData();
    }, []);

    // Render loading state
    if (isLoading) {
        return <div className="loading-indicator">Loading data...</div>;
    }

    // Render error state
    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    // Rest of your component rendering code follows...
    return (<div className="merged-table-container">
            <h2>Trader Rankings</h2>
            <div className="table-wrapper">
                <table className="merged-table">
                    <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Scenario</th>
                        <th>TraderID</th>
                        <th>Profit Factor</th>
                        <th>Max Profit</th>
                        <th>Max Drawdown</th>
                        <th>Composite Score</th>
                    </tr>
                    </thead>
                    <tbody>
                    {mergedData.map((row, index) => (<tr key={index} onClick={() => handleRowClick(row)}>
                            <td>{row.Rank}</td>
                            <td>{row.Scenario}</td>
                            <td>{row.TraderID}</td>
                            <td>{row.ProfitFactor}</td>
                            <td>{row.MaxProfit}</td>
                            <td>{row.MaxDrawdown}</td>
                            <td>{row.CompositeScore}</td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>);
};

export default MergedTable;