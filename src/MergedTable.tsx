// src/MergedTable.tsx
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { AggregatedSummaryRow, FilteredSetupRow, MergedData } from "./types";

interface MergedTableProps {
    onRowSelect: (row: MergedData) => void;
}

const MergedTable = ({ onRowSelect }: MergedTableProps) => {
    const [mergedData, setMergedData] = useState<MergedData[]>([]);

    const handleRowClick = (row: MergedData) => {
        onRowSelect(row);
    };



    useEffect(() => {
        const loadAndMergeData = async () => {
            // Load filtered-setups.csv
            const filteredSetupsResponse = await fetch("/filtered-setups.csv");
            const filteredSetupsText = await filteredSetupsResponse.text();
            const filteredSetupsData = Papa.parse<FilteredSetupRow>(filteredSetupsText, {
                header: true, skipEmptyLines: true,
            }).data;

            // Load aggregated_filtered_summary.csv
            const aggregatedSummaryResponse = await fetch("/aggregated_filtered_summary.csv");
            const aggregatedSummaryText = await aggregatedSummaryResponse.text();
            const aggregatedSummaryData = Papa.parse<AggregatedSummaryRow>(aggregatedSummaryText, {
                header: true, skipEmptyLines: true,
            }).data;

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
                    hourDay: setupRow.hourDay,
                    Symbol: setupRow.Symbol
                };
            });

            setMergedData(merged);
        };

        loadAndMergeData();
    }, []);

    return (
        <div className="table-container">
            <table border={1}>
                <thead>
                <tr>
                    <th>Rank</th>
                    <th>Scenario</th>
                    <th>TraderID</th>
                    <th>TotalProfit</th>
                    <th>TradeCount</th>
                    <th>BestTrade</th>
                    <th>WorstTrade</th>
                    <th>ProfitStdDev</th>
                </tr>
                </thead>
                <tbody>
                {mergedData.map((row) => (
                    <tr key={row.Rank} onClick={() => handleRowClick(row)}>
                        <td>{row.Rank}</td>
                        <td>{row.Scenario}</td>
                        <td>{row.TraderID}</td>
                        <td>{row.totalprofit}</td>
                        <td>{row.tradecount}</td>
                        <td>{row.besttrade}</td>
                        <td>{row.worsttrade}</td>
                        <td>{row.profit_stddev}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default MergedTable;