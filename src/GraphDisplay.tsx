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
            <div className="graph-details">
                {selectedRow && (
                    <div className="graph-metadata">
                        <p><strong>Scenario:</strong> {selectedRow.Scenario}</p>
                        <p><strong>Trader ID:</strong> {selectedRow.TraderID}</p>
                        <p><strong>Total Profit:</strong> {selectedRow.TotalProfit}</p>
                        <p><strong>Composite Score:</strong> {selectedRow.CompositeScore}</p>
                    </div>
                )}
            </div>
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