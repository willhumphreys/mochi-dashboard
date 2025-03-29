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
                const summaryRow = aggregatedSummaryData.find((summaryRow) => summaryRow.Rank === setupRow.Rank);
                return {
                    Rank: setupRow.Rank,
                    Scenario: setupRow.scenario,
                    TraderID: setupRow.traderid,
                    TotalProfit: setupRow.totalprofit,
                    TradeCount: setupRow.tradecount,
                    BestTrade: setupRow.besttrade,
                    WorstTrade: setupRow.worsttrade,
                    ProfitStdDev: setupRow.profit_stddev,
                    WinCount: setupRow.wincount,
                    LoseCount: setupRow.losecount,
                    AverageNetProfit: setupRow.averagenetprofit,
                    MaxDrawdown: summaryRow?.MaxDrawdown || "",
                    MaxProfit: summaryRow?.MaxProfit || "",
                    ProfitFactor: summaryRow?.ProfitFactor || "",
                    CompositeScore: summaryRow?.CompositeScore || "",
                    RiskRewardBalance: summaryRow?.RiskRewardBalance || "",
                    dayofweek: Number(setupRow?.dayofweek || 0),
                    hourofday: Number(setupRow?.hourofday || 0),
                    stop: Number(setupRow?.stop || 0),
                    limit: Number(setupRow?.limit || 0),
                    tickoffset: Number(setupRow?.tickoffset || 0),
                    tradeduration: Number(setupRow?.tradeduration || 0),
                    outoftime: Number(setupRow?.outoftime || 0)
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
                        <td>{row.TotalProfit}</td>
                        <td>{row.TradeCount}</td>
                        <td>{row.BestTrade}</td>
                        <td>{row.WorstTrade}</td>
                        <td>{row.ProfitStdDev}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default MergedTable;