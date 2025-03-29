import { useEffect, useState } from "react";
import Papa from "papaparse";
import { FilteredSetupRow, AggregatedSummaryRow, MergedData } from "./types";

const MergedTable = () => {
    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [selectedGraph, setSelectedGraph] = useState<string | null>(null);

    useEffect(() => {
        const loadAndMergeData = async () => {
            // Load filtered-setups.csv
            const filteredSetupsResponse = await fetch("/filtered-setups.csv");
            const filteredSetupsText = await filteredSetupsResponse.text();
            const filteredSetupsData = Papa.parse<FilteredSetupRow>(filteredSetupsText, {
                header: true,
                skipEmptyLines: true,
            }).data;

            // Load aggregated_filtered_summary.csv
            const aggregatedSummaryResponse = await fetch("/aggregated_filtered_summary.csv");
            const aggregatedSummaryText = await aggregatedSummaryResponse.text();
            const aggregatedSummaryData = Papa.parse<AggregatedSummaryRow>(aggregatedSummaryText, {
                header: true,
                skipEmptyLines: true,
            }).data;

            // Merge data based on Rank column
            const merged = filteredSetupsData.map((setupRow) => {
                const summaryRow = aggregatedSummaryData.find(
                    (summaryRow) => summaryRow.Rank === setupRow.Rank
                );
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
                };
            });

            setMergedData(merged);
        };

        loadAndMergeData();
    }, []);

    // Handle row click to set the selected graph
    const handleRowClick = (row: MergedData) => {
        const symbol = 'AAPL_polygon_min'
        const graphName = `${symbol}_${row.Scenario}_${row.TraderID}.png`;
        setSelectedGraph(graphName);
    };

    return (
        <div>
            <h1>Merged Data Table</h1>
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
                    <th>WinCount</th>
                    <th>LoseCount</th>
                    <th>AverageNetProfit</th>
                    <th>MaxDrawdown</th>
                    <th>MaxProfit</th>
                    <th>ProfitFactor</th>
                    <th>CompositeScore</th>
                    <th>RiskRewardBalance</th>
                </tr>
                </thead>
                <tbody>
                {mergedData.map((row, index) => (
                    <tr key={index} onClick={() => handleRowClick(row)} style={{ cursor: "pointer" }}>
                        {Object.values(row).map((value, idx) => (
                            <td key={idx}>{value}</td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Display the selected graph */}
            {selectedGraph && (
                <div style={{ marginTop: "20px" }}>
                    <h2>Selected Graph:</h2>
                    <img
                        src={`/graphs/${selectedGraph}`}
                        alt={`Graph for ${selectedGraph}`}
                        style={{ maxWidth: "100%", height: "auto" }}
                    />
                </div>
            )}
        </div>
    );
};

export default MergedTable;
