// src/MergedTable.tsx
import {useEffect, useState} from "react";
import Papa from "papaparse";
import {AggregatedSummaryRow, FilteredSetupRow, MergedData} from "./types";
import {getDirectS3Url, getS3ImageUrl} from "./services/S3Service";

interface MergedTableProps {
    onRowSelect: (row: MergedData) => void;
    symbol?: string; // New prop to allow passing a symbol
    data?: MergedData[]; // Optional pre-loaded data
}

const MergedTable = ({onRowSelect, symbol = "AAPL_polygon_min", data}: MergedTableProps) => {
    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleRowClick = (row: MergedData) => {
        onRowSelect(row);
    };

    useEffect(() => {
        // If pre-loaded data is provided, use that instead of fetching
        if (data && data.length > 0) {
            setMergedData(data);
            setIsLoading(false);
            return;
        }

        const loadAndMergeData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Define the S3 paths for the CSV files using the provided symbol
                const filteredSetupsKey = `${symbol}/filtered-setups.csv`;
                const aggregatedSummaryKey = `${symbol}/aggregated_filtered_summary.csv`;

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
                const [filteredSetupsResponse, aggregatedSummaryResponse] = await Promise.all([
                    fetch(filteredSetupsUrl),
                    fetch(aggregatedSummaryUrl)
                ]);

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

                console.log(`${symbol} - Filtered setups data:`, filteredSetupsData.length, "rows");
                console.log(`${symbol} - Aggregated summary data:`, aggregatedSummaryData.length, "rows");

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
                        tradecount: setupRow.tradecount || 0,
                        besttrade: setupRow.besttrade || 0,
                        worsttrade: setupRow.worsttrade || 0,
                        profit_stddev: setupRow.profit_stddev || 0,
                        wincount: setupRow.wincount || 0,
                        losecount: setupRow.losecount || 0,
                        winningticks: setupRow.winningticks || 0,
                        losingticks: setupRow.losingticks || 0,
                        averagenetprofit: setupRow.averagenetprofit || 0,
                        winningyears: setupRow.winningyears || 0,
                        dayofweek: setupRow.dayofweek || 0,
                        hourofday: setupRow.hourofday || 0,
                        stop: setupRow.stop || 0,
                        limit: setupRow.limit || 0,
                        tickoffset: setupRow.tickoffset || 0,
                        tradeduration: setupRow.tradeduration || 0,
                        outoftime: setupRow.outoftime || 0,
                        averagewinner: setupRow.averagewinner || 0,
                        averageloser: setupRow.averageloser || 0,
                        reward_risk_ratio: setupRow.reward_risk_ratio || 0,
                        cte_win_loss_ratio: setupRow.cte_win_loss_ratio || 0,
                        winnerprobability: setupRow.winnerprobability || 0,
                        loserprobability: setupRow.loserprobability || 0,
                        endurance_rank: setupRow.endurance_rank || 0,
                        pain_tolerance_rank: setupRow.pain_tolerance_rank || 0,
                        trend_reversal_rank: setupRow.trend_reversal_rank || 0,
                        appt: setupRow.appt || 0,
                        sharpe_ratio: setupRow.sharpe_ratio || 0,
                        modified_sharpe_ratio: setupRow.modified_sharpe_ratio || 0,
                        profit_to_max_drawdown_ratio: setupRow.profit_to_max_drawdown_ratio || 0,
                        profit_to_risk_ratio: setupRow.profit_to_risk_ratio || 0,
                        profit_factor: setupRow.profit_factor || 0,
                        kelly_fraction: setupRow.kelly_fraction || 0,
                        coefficient_of_variation: setupRow.coefficient_of_variation || 0,
                        sortino_ratio: setupRow.sortino_ratio || 0,
                        profit_per_risk_ratio: setupRow.profit_per_risk_ratio || 0,
                        calmar_ratio: setupRow.calmar_ratio || 0,
                        recovery_factor: setupRow.recovery_factor || 0,
                        sterling_ratio: setupRow.sterling_ratio || 0,
                        max_drawdown_percentage: setupRow.max_drawdown_percentage || 0,
                        avg_profit_to_max_drawdown: setupRow.avg_profit_to_max_drawdown || 0,
                        max_drawdown_duration: setupRow.max_drawdown_duration || 0,
                        ulcer_index: setupRow.ulcer_index || 0,
                        pain_index: setupRow.pain_index || 0,
                        martin_ratio: setupRow.martin_ratio || 0,
                        drawdown_events_count: setupRow.drawdown_events_count || 0,
                        max_melt_up: setupRow.max_melt_up || 0,
                        max_melt_up_duration: setupRow.max_melt_up_duration || 0,
                        max_melt_up_percentage: setupRow.max_melt_up_percentage || 0,
                        melt_up_events_count: setupRow.melt_up_events_count || 0,
                        avg_melt_up: setupRow.avg_melt_up || 0,
                        max_consecutive_winners: setupRow.max_consecutive_winners || 0,
                        avg_consecutive_winners: setupRow.avg_consecutive_winners || 0,
                        max_consecutive_losers: setupRow.max_consecutive_losers || 0,
                        avg_consecutive_losers: setupRow.avg_consecutive_losers || 0,
                        max_drawdown: setupRow.max_drawdown || 0,
                        profitColumn: setupRow.profitColumn || 0,
                        hourDay: setupRow.hourDay || 0,
                        Symbol: setupRow.Symbol || "",
                    } as MergedData;
                });

                setMergedData(merged);
            } catch (error) {
                console.error("Error loading data:", error);
                setError(error instanceof Error ? error.message : String(error));
            } finally {
                setIsLoading(false);
            }
        };

        loadAndMergeData();
    }, [symbol, data]); // Re-run when symbol or data changes

    if (isLoading) {
        return <div className="loading">Loading data for {symbol}...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="merged-table-container">
            <h3>Merged Data for {symbol}</h3>
            <table className="merged-table">
                <thead>
                <tr>
                    <th>Rank</th>
                    <th>Scenario</th>
                    <th>Trader ID</th>
                    <th>Setup</th>
                    <th>Total Profit</th>
                    <th>Max Drawdown</th>
                    <th>Max Profit</th>
                    <th>Profit Factor</th>
                    <th>Risk/Reward</th>
                    <th>Score</th>
                </tr>
                </thead>
                <tbody>
                {mergedData.map((row, index) => (
                    <tr key={index} onClick={() => handleRowClick(row)}>
                        <td>{row.Rank}</td>
                        <td>{row.Scenario}</td>
                        <td>{row.TraderID}</td>
                        <td>{row.Setup}</td>
                        <td>{row.totalprofit}</td>
                        <td>{row.MaxDrawdown}</td>
                        <td>{row.MaxProfit}</td>
                        <td>{row.ProfitFactor}</td>
                        <td>{row.RiskRewardBalance}</td>
                        <td>{row.CompositeScore}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default MergedTable;