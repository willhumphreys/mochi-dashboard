// LiveTradesViewer.tsx
import { useState, useEffect } from 'react';
import { fetchLiveTradesForSymbol, getLiveTradeSymbols } from './services/S3Service';
import { TradeData } from "./types";
import SymbolSelector from './SymbolSelector';
import { getBrokers, BrokerInfo } from './services/BrokerService';
import AddTradeForm from './AddTradeForm';
import CreateTickerForm from './CreateTickerForm';
import TradeSummary from "./TradeSummary.tsx";
import {TradesTable} from './LiveTradesTable';

interface LiveTradesViewerProps {
  initialSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
  initialBroker?: string;
}

export const LiveTradesViewer: React.FC<LiveTradesViewerProps> = ({
                                                                    initialSymbol = 'AAPL',
                                                                    initialBroker = '',
                                                                    onSymbolChange
                                                                  }) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [broker, setBroker] = useState<string>(initialBroker);
  const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [symbolRefreshCounter, setSymbolRefreshCounter] = useState<number>(0);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  // Fetch available brokers
  useEffect(() => {
    const loadBrokers = async () => {
      try {
        const brokersList = await getBrokers();
        setBrokers(brokersList);

        // Set default broker if none is selected yet
        if (!broker && brokersList.length > 0) {
          setBroker(brokersList[0].name);
        }
      } catch (err) {
        console.error('Failed to load brokers:', err);
        setError('Failed to load broker list. Please try again.');
      }
    };

    loadBrokers();
  }, []);

  // Load available symbols when broker changes
  useEffect(() => {
    const loadSymbols = async () => {
      if (!broker) return;

      try {
        setLoading(true);
        const symbols = await getLiveTradeSymbols(broker);
        setAvailableSymbols(symbols);

        // If there are symbols and current symbol isn't in the list, select the first one
        if (symbols.length > 0 && !symbols.includes(symbol)) {
          setSymbol(symbols[0]);
        } else if (symbols.length === 0) {
          // If no symbols are available, clear the selection
          setSymbol('');
          setTradeData([]);
        }

      } catch (err) {
        console.error(`Failed to load symbols for broker ${broker}:`, err);
        setError(`Failed to load symbols for broker ${broker}`);
        setAvailableSymbols([]);
      } finally {
        setLoading(false);
      }
    };

    loadSymbols();
  }, [broker, symbolRefreshCounter]);

  const handleTradeAdded = (newTrade: TradeData) => {
    setTradeData(prevTrades => [...prevTrades, newTrade]);
  };

  // Handle when a new ticker is created
  const handleTickerCreated = (newSymbol: string) => {
    // Trigger a refresh of the symbols list
    setSymbolRefreshCounter(prev => prev + 1);
    // Switch to the newly created ticker
    setSymbol(newSymbol);
  };

  // Fetch trade data when symbol changes (only if both symbol and broker are selected)
  useEffect(() => {
    const fetchData = async () => {
      if (!broker || !symbol) return; // Don't fetch if no broker or symbol selected

      setLoading(true);
      setError(null);

      try {
        const data = await fetchLiveTradesForSymbol(symbol, broker);
        setTradeData(data);
        if (onSymbolChange) {
          onSymbolChange(symbol);
        }
      } catch (err) {
        setError(`Failed to load data for ${symbol} (broker: ${broker}): ${err instanceof Error ? err.message : String(err)}`);
        setTradeData([]);
      } finally {
        setLoading(false);
      }
    };

    if (symbol && broker) {
      fetchData();
    }
  }, [symbol, broker, onSymbolChange]);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  const handleBrokerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBroker(e.target.value);
    // Symbol will be updated by the useEffect that fetches symbols when broker changes
  };

  // In LiveTradesViewer.tsx
  return (
      <div className="live-trades-viewer">
        <div className="control-panel">
          <h2>Live Trades Viewer</h2>

          <div className="broker-selector">
            <label htmlFor="broker-select">Broker:</label>
            <select
                id="broker-select"
                value={broker}
                onChange={handleBrokerChange}
                disabled={loading || brokers.length === 0}
            >
              {brokers.length === 0 && (
                  <option value="">Loading brokers...</option>
              )}
              {brokers.map(b => (
                  <option key={b.name} value={b.name}>{b.displayName}</option>
              ))}
            </select>
          </div>

          <SymbolSelector
              onSymbolChange={handleSymbolChange}
              availableSymbols={availableSymbols}
              currentSymbol={symbol}
              loading={loading}
          />

          {/* Add these components with the handlers */}
          {broker && (
              <>
                <AddTradeForm
                    symbol={symbol}
                    broker={broker}
                    onTradeAdded={handleTradeAdded}
                />

                <CreateTickerForm
                    broker={broker}
                    onTickerCreated={handleTickerCreated}
                />
              </>
          )}

          {error && <div className="error-message">{error}</div>}

          {!loading && !error && tradeData.length > 0 && (
              <>
                <TradeSummary tradeData={tradeData} />
                <TradesTable
                    tradeData={tradeData}  // Changed from trades to tradeData
                    symbol={symbol}
                    broker={broker}
                />

              </>
          )}


          {!loading && !error && tradeData.length === 0 && symbol && (
              <div className="no-data-message">No trades found for {symbol}</div>
          )}
        </div>
      </div>
  );
};