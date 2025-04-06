// src/components/TradesTable.tsx
import { TradeData } from './types';

interface TradesTableProps {
    symbol: string;
    tradeData: TradeData[];
}

export const TradesTable: React.FC<TradesTableProps> = ({ symbol, tradeData }) => {
    if (tradeData.length === 0) {
        return <div className="no-data">No trade data available for {symbol}</div>;
    }

    return (
        <div className="trades-table-container">
            <h3>{symbol} Trade Data ({tradeData.length} records)</h3>

            <table className="trades-table">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Trader ID</th>
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
                {tradeData.map((trade, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{trade.traderid}</td>
                        <td>{trade.dayofweek}</td>
                        <td>{trade.hourofday}</td>
                        <td>{trade.stop}</td>
                        <td>{trade.limit}</td>
                        <td>{trade.tickoffset}</td>
                        <td>{trade.tradeduration}</td>
                        <td>{trade.outoftime}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default TradesTable;