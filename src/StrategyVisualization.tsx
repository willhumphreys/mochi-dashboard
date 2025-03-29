// src/StrategyVisualization.tsx
import { MergedData } from "./types";
import GraphDisplay from "./GraphDisplay";

interface StrategyVisualizationProps {
  selectedStrategy: MergedData | null;
}

const StrategyVisualization = ({ selectedStrategy }: StrategyVisualizationProps) => {
  const selectedGraph = selectedStrategy 
    ? `AAPL_polygon_min_${selectedStrategy.Scenario}_${selectedStrategy.TraderID}.png` 
    : null;

  return (
    <div className="graph-section">
      {selectedStrategy ? (
        <div className="graph-container">
          <div className="graph-details">
            <h3>Strategy Details</h3>
            <div className="graph-metadata">
              <p><strong>Rank:</strong> {selectedStrategy.Rank}</p>
              <p><strong>Scenario:</strong> {selectedStrategy.Scenario}</p>
              <p><strong>Trader ID:</strong> {selectedStrategy.TraderID}</p>
              <p><strong>Total Profit:</strong> {selectedStrategy.TotalProfit}</p>
              <p><strong>Win/Loss:</strong> {selectedStrategy.WinCount}/{selectedStrategy.LoseCount}</p>
              {/* Add other metadata as needed */}
            </div>
          </div>
          <GraphDisplay selectedGraph={selectedGraph} selectedRow={selectedStrategy} />
        </div>
      ) : (
        <div className="graph-placeholder">
          <p>Select a strategy to view details</p>
        </div>
      )}
    </div>
  );
};

export default StrategyVisualization;