// TradesTable.tsx
import { useState, useEffect } from 'react';
import Papa, {ParseResult} from 'papaparse';


export enum TradeState {

  LIMIT = "LIMIT",
  CLOSED_AT_TIME = "CLOSED_AT_TIME",
  POISON = "POISON",
  OUT_OF_TIME = "OUT_OF_TIME",
  PLACED = "PLACED",
  FILLED = "FILLED",
  CREATED = "CREATED",
  POISON_CREATED = "POISON_CREATED",
  POISON_PLACED = "POISON_PLACED",
  POISON_FILLED = "POISON_FILLED",
  STOPPED = "STOPPED"
}


// Interface for a single trade record from the CSV
export interface TradeRecord {
  PlaceDateTime: string;
  FilledPrice: number;
  ClosingPrice: number;
  Profit: number;
  RunningTotalProfit: number;
  State: TradeState | string;
}

// Raw data coming from CSV before type conversion
interface RawTradeRecord {
  PlaceDateTime: string;
  FilledPrice: string;
  ClosingPrice: string;
  Profit: string;
  RunningTotalProfit: string;
  State: string;
}

interface TradesTableProps {
  tradesUrl: string | null;
}





interface TradesTableProps {
  tradesUrl: string | null;
}

export const TradesTable = ({ tradesUrl }: TradesTableProps) => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      if (!tradesUrl) {
        setTrades([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(tradesUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch trades: ${response.status}`);
        }

        const csvText = await response.text();

        Papa.parse<RawTradeRecord>(csvText, {
          header: true,
          complete: (results: ParseResult<RawTradeRecord>) => {
            // Convert string values to numbers where appropriate
            const parsedTrades = results.data
                .filter(trade => Object.keys(trade).length > 1) // Filter out empty rows
                .map((trade) => ({
                  ...trade,
                  FilledPrice: parseFloat(trade.FilledPrice),
                  ClosingPrice: parseFloat(trade.ClosingPrice),
                  Profit: parseFloat(trade.Profit),
                  RunningTotalProfit: parseFloat(trade.RunningTotalProfit),
                })) as TradeRecord[];

            setTrades(parsedTrades);
          },
          error: (error: Error) => {
            setError(`CSV parsing error: ${error.message}`);
          }
        });
      } catch (err) {
        console.error("Error fetching trades data:", err);
        setError(err instanceof Error ? err.message : "Failed to load trades data");
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [tradesUrl]);


  if (loading) return <div>Loading trades data...</div>;
  if (error) return <div>Error loading trades: {error}</div>;
  if (trades.length === 0) return null;

  return (
    <div className="trades-container">
      <h3>Strategy Trades</h3>
      <div className="trades-table-wrapper">
        <table className="trades-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date/Time</th>
              <th>Entry Price</th>
              <th>Exit Price</th>
              <th>Profit</th>
              <th>Running Total</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr key={index} className={trade.Profit >= 0 ? "profit-positive" : "profit-negative"}>
                <td>{index + 1}</td>
                <td>{trade.PlaceDateTime}</td>
                <td>{trade.FilledPrice}</td>
                <td>{trade.ClosingPrice}</td>
                <td className={trade.Profit >= 0 ? "profit-positive" : "profit-negative"}>
                  {trade.Profit}
                </td>
                <td>{trade.RunningTotalProfit}</td>
                <td>{trade.State}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};