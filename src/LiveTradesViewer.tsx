// src/LiveTradesViewer.tsx
import { useState, useEffect } from 'react';
import { fetchLiveTradesForSymbol } from './services/S3Service';
import { TradeData } from "./types";
import SymbolSelector from './SymbolSelector';
import TradeSummary from './TradeSummary';
import {TradesTable} from "./LiveTradesTable.tsx";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  return (
      <div className="live-trades-viewer">
        <div className="control-panel">
          <h2>Live Trades Viewer</h2>

          <SymbolSelector
              initialSymbol={initialSymbol}
              onSymbolChange={handleSymbolChange}
              disabled={loading}
          />

          {loading && <div className="loading">Loading trade data...</div>}
          {error && <div className="error">{error}</div>}
        </div>

        {!loading && !error && (
            <div className="data-display">
              <TradesTable
                  symbol={symbol}
                  tradeData={tradeData}
              />

              <TradeSummary
                  tradeData={tradeData}
              />
            </div>
        )}
      </div>
  );
};

export default LiveTradesViewer;