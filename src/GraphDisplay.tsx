// src/GraphDisplay.tsx
import { FC } from "react";
import { MergedData } from "./types";

interface GraphDisplayProps {
    selectedGraph: string | null;
    selectedRow: MergedData | null;
}

const GraphDisplay: FC<GraphDisplayProps> = ({ selectedGraph, selectedRow }) => {
    if (!selectedGraph) {
        return <div className="graph-placeholder">Select a row to view the graph</div>;
    }

    return (
        <div className="graph-container">
            <h2>Strategy Visualization</h2>
            {selectedRow && (
                <div className="strategy-details">
                    <div className="detail-section">
                        <h3>Strategy Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Rank:</span>
                                <span className="value">{selectedRow.Rank}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Scenario:</span>
                                <span className="value">{selectedRow.Scenario}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Trader ID:</span>
                                <span className="value">{selectedRow.TraderID}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Performance Metrics</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Total Profit:</span>
                                <span className="value">{selectedRow.TotalProfit}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Average Net Profit:</span>
                                <span className="value">{selectedRow.AverageNetProfit}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Best Trade:</span>
                                <span className="value">{selectedRow.BestTrade}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Worst Trade:</span>
                                <span className="value">{selectedRow.WorstTrade}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Profit StdDev:</span>
                                <span className="value">{selectedRow.ProfitStdDev}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Trade Statistics</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Trade Count:</span>
                                <span className="value">{selectedRow.TradeCount}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Win Count:</span>
                                <span className="value">{selectedRow.WinCount}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Lose Count:</span>
                                <span className="value">{selectedRow.LoseCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Risk & Reward Analysis</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Max Drawdown:</span>
                                <span className="value">{selectedRow.MaxDrawdown || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Max Profit:</span>
                                <span className="value">{selectedRow.MaxProfit || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Profit Factor:</span>
                                <span className="value">{selectedRow.ProfitFactor || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Composite Score:</span>
                                <span className="value">{selectedRow.CompositeScore || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Risk Reward Balance:</span>
                                <span className="value">{selectedRow.RiskRewardBalance || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="graph-image">
                <img
                    src={`/graphs/${selectedGraph}`}
                    alt={`Graph for ${selectedGraph}`}
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder-graph.png";
                    }}
                />
            </div>
        </div>
    );
};

export default GraphDisplay;