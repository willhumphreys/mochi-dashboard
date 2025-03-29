// src/TraderConfigurationDetails.tsx
import {FC} from "react";
import {TraderConfigDetails} from "./types.ts";

interface TraderDetailsProps {
  configDetails: TraderConfigDetails;
}

const TraderDetailsTable: FC<TraderDetailsProps> = ({ configDetails }) => {
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
      </div>
  );
};

export default TraderDetailsTable;