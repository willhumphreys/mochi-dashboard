import { useState, useEffect } from 'react';
import { fetchLiveTradesForSymbol, getLiveTradeSymbols } from './services/S3Service';
import {TradeData} from "./types.ts";

interface LiveTradesViewerProps {
  initialSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

export const LiveTradesViewer: React.FC<LiveTradesViewerProps> = ({ 
  initialSymbol = 'AAPL', 
  onSymbolChange 
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available symbols on component mount
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const symbols = await getLiveTradeSymbols();
        setAvailableSymbols(symbols);
        
        // Set default symbol if the initial one is not available
        if (symbols.length > 0 && !symbols.includes(symbol)) {
          setSymbol(symbols[0]);
        }
      } catch (err) {
        setError(`Failed to load available symbols: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    fetchSymbols();
  }, []);

  // Fetch trade data when symbol changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchLiveTradesForSymbol(symbol);
        setTradeData(data);
        if (onSymbolChange) {
          onSymbolChange(symbol);
        }
      } catch (err) {
        setError(`Failed to load data for ${symbol}: ${err instanceof Error ? err.message : String(err)}`);
        setTradeData([]);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol, onSymbolChange]);

  const handleSymbolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSymbol(event.target.value);
  };

  return (
    <div className="live-trades-viewer">
      <div className="control-panel">
        <h2>Live Trades Viewer</h2>
        
        <div className="symbol-selector">
          <label htmlFor="symbol-select">Select Symbol:</label>
          <select
            id="symbol-select"
            value={symbol}
            onChange={handleSymbolChange}
            disabled={loading || availableSymbols.length === 0}
          >
            {availableSymbols.length === 0 ? (
              <option value="">Loading symbols...</option>
            ) : (
              availableSymbols.map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))
            )}
          </select>
        </div>
        
        {loading && <div className="loading">Loading trade data...</div>}
        {error && <div className="error">{error}</div>}
      </div>

      {!loading && !error && (
        <div className="data-display">
          <h3>{symbol} Trade Data ({tradeData.length} records)</h3>
          
          {tradeData.length > 0 ? (
            <div className="trades-table-container">
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
          ) : (
            <div className="no-data">No trade data available for {symbol}</div>
          )}
          
          <div className="data-summary">
            <h4>Data Summary</h4>
            {tradeData.length > 0 ? (
              <div className="summary-stats">
                <div>
                  <strong>Total Trades:</strong> {tradeData.length}
                </div>
                <div>
                  <strong>Avg Stop:</strong> {(tradeData.reduce((sum, trade) => sum + trade.stop, 0) / tradeData.length).toFixed(2)}
                </div>
                <div>
                  <strong>Avg Limit:</strong> {(tradeData.reduce((sum, trade) => sum + trade.limit, 0) / tradeData.length).toFixed(2)}
                </div>
                <div>
                  <strong>Avg Tick Offset:</strong> {(tradeData.reduce((sum, trade) => sum + trade.tickoffset, 0) / tradeData.length).toFixed(2)}
                </div>
                <div>
                  <strong>Avg Duration:</strong> {(tradeData.reduce((sum, trade) => sum + trade.tradeduration, 0) / tradeData.length).toFixed(2)}
                </div>
              </div>
            ) : (
              <div>No data available for summary</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTradesViewer;