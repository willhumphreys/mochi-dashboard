// src/components/TradeSummary.tsx
import { TradeData } from './types';

interface TradeSummaryProps {
    tradeData: TradeData[];
}

export const TradeSummary: React.FC<TradeSummaryProps> = ({ tradeData }) => {
    if (tradeData.length === 0) {
        return <div className="no-data-summary">No data available for summary</div>;
    }

    // Calculate summary statistics
    const avgStop = (tradeData.reduce((sum, trade) => sum + trade.stop, 0) / tradeData.length).toFixed(2);
    const avgLimit = (tradeData.reduce((sum, trade) => sum + trade.limit, 0) / tradeData.length).toFixed(2);
    const avgTickOffset = (tradeData.reduce((sum, trade) => sum + trade.tickoffset, 0) / tradeData.length).toFixed(2);
    const avgDuration = (tradeData.reduce((sum, trade) => sum + trade.tradeduration, 0) / tradeData.length).toFixed(2);

    // Count trades by day of week
    const tradesByDay = tradeData.reduce<Record<string | number, number>>((acc, trade) => {
        const day = trade.dayofweek;
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="data-summary">
            <h4>Data Summary</h4>
            <div className="summary-stats">
                <div>
                    <strong>Total Trades:</strong> {tradeData.length}
                </div>
                <div>
                    <strong>Avg Stop:</strong> {avgStop}
                </div>
                <div>
                    <strong>Avg Limit:</strong> {avgLimit}
                </div>
                <div>
                    <strong>Avg Tick Offset:</strong> {avgTickOffset}
                </div>
                <div>
                    <strong>Avg Duration:</strong> {avgDuration}
                </div>
            </div>

            {Object.keys(tradesByDay).length > 0 && (
                <div className="trades-by-day">
                    <h5>Trades by Day of Week</h5>
                    <div className="day-stats">
                        {Object.entries(tradesByDay).map(([day, count]) => (
                            <div key={day}>
                                <strong>Day {day}:</strong> {count} trades
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeSummary;