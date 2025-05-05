// src/TraderConfigurationDetails.tsx
import {FC} from "react";
import {TraderConfigDetails} from "./types.ts";

interface TraderDetailsProps {
  configDetails: TraderConfigDetails;
}

const TraderDetailsTable: FC<TraderDetailsProps> = ({ configDetails }) => {
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

  return (
      <div className="trader-details">
        <h3>Trader Configuration</h3>
        <div className="config-table-container">
          <table className="config-table">
            <thead>
            <tr>
              <th>Rank</th>
              <th>Day of Week</th>
              <th>Hour of Day</th>
              <th>Stop</th>
              <th>Limit</th>
              <th>Tick Offset</th>
              <th>Trade Duration</th>
              <th>Out of Time</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>{configDetails.rank}</td>
              <td>{configDetails.dayofweek}</td>
              <td>{configDetails.hourofday}</td>
              <td>{configDetails.stop}</td>
              <td>{configDetails.limit}</td>
              <td>{configDetails.tickoffset}</td>
              <td>{configDetails.tradeduration}</td>
              <td>{configDetails.outoftime}</td>
            </tr>
            </tbody>
          </table>
        </div>

        {/* Performance Summary */}
        {(configDetails.totalprofit !== undefined || configDetails.tradecount !== undefined) && (
          <div className="performance-summary">
            <h3>Performance Summary</h3>
            <div className="config-table-container">
              <table className="config-table">
                <tbody>
                  <tr>
                    <th>Total Profit</th>
                    <td>{formatNumber(configDetails.totalprofit)}</td>
                    <th>Trade Count</th>
                    <td>{configDetails.tradecount}</td>
                  </tr>
                  <tr>
                    <th>Win Count</th>
                    <td>{configDetails.wincount}</td>
                    <th>Loss Count</th>
                    <td>{configDetails.losecount}</td>
                  </tr>
                  <tr>
                    <th>Best Trade</th>
                    <td>{formatNumber(configDetails.besttrade)}</td>
                    <th>Worst Trade</th>
                    <td>{formatNumber(configDetails.worsttrade)}</td>
                  </tr>
                  <tr>
                    <th>Profit Factor</th>
                    <td>{formatNumber(configDetails.ProfitFactor)}</td>
                    <th>Avg. Net Profit</th>
                    <td>{formatNumber(configDetails.averagenetprofit)}</td>
                  </tr>
                  <tr>
                    <th>Max Profit</th>
                    <td>{formatNumber(configDetails.MaxProfit)}</td>
                    <th>Max Drawdown</th>
                    <td>{formatNumber(configDetails.MaxDrawdown)}</td>
                  </tr>
                  <tr>
                    <th>Stopped Count</th>
                    <td>{formatNumber(configDetails.stopped_trade_count, 0)}</td>
                    <th>Limit Count</th>
                    <td>{formatNumber(configDetails.limit_trade_count, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
};

export default TraderDetailsTable;
