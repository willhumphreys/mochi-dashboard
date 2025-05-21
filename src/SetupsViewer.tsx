// SetupsViewer.tsx
import { useState, useEffect } from 'react';
import { fetchLiveTradesForSymbol, getLiveTradeSymbols } from './services/S3Service';
import { TradeData } from "./types";
import SymbolSelector from './SymbolSelector';
import { getBrokers, BrokerInfo } from './services/BrokerService';
import AddSetupForm from './AddSetupForm';
import CreateTickerForm from './CreateTickerForm';
import TradeSummary from "./TradeSummary";
import { TradesTable } from './LiveTradesTable';

interface SetupsViewerProps {
  initialSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
  initialBroker?: string;
}

export const SetupsViewer: React.FC<SetupsViewerProps> = ({
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
  }, [broker]);

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
  }, [broker, symbolRefreshCounter, symbol]);

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

  // Fetch trade data when symbol changes
  useEffect(() => {
    const fetchData = async () => {
      if (!broker || !symbol) return;

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
  };

  const getSelectedBrokerDisplayName = () => {
    const selectedBroker = brokers.find(b => b.name === broker);
    return selectedBroker ? selectedBroker.displayName : broker;
  };

  return (
      <div className="setups-viewer">
        <h2 className="page-title">Setups Management</h2>

        {/* Control Panel Section */}
        <div className="card control-panel">
          <div className="card-header">
            <h3>Select Broker and Symbol</h3>
          </div>
          <div className="card-body">
            <div className="selectors-container">
              <div className="selector-group">
                <label htmlFor="broker-select">Broker:</label>
                <select
                    id="broker-select"
                    value={broker}
                    onChange={handleBrokerChange}
                    disabled={loading || brokers.length === 0}
                    className="form-select"
                >
                  {brokers.length === 0 && (
                      <option value="">Loading brokers...</option>
                  )}
                  {brokers.map(b => (
                      <option key={b.name} value={b.name}>{b.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="selector-group">
                <SymbolSelector
                    onSymbolChange={handleSymbolChange}
                    availableSymbols={availableSymbols}
                    currentSymbol={symbol}
                    loading={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Symbol Creation Section */}
        {broker && (
            <div className="card symbol-management">
              <div className="card-header">
                <h3>Create New Symbol</h3>
              </div>
              <div className="card-body">
                <CreateTickerForm
                    broker={broker}
                    onTickerCreated={handleTickerCreated}
                />
              </div>
            </div>
        )}

        {/* Setups Display Section */}
        {broker && symbol && (
            <div className="card setups-display">
              <div className="card-header">
                <h3>Setups for {symbol}</h3>
                <div className="broker-badge">
                  {getSelectedBrokerDisplayName()}
                </div>
              </div>
              <div className="card-body">
                {error && (
                    <div className="alert alert-error">
                      <span className="error-icon">⚠️</span>
                      <span>{error}</span>
                    </div>
                )}

                <div className="setup-actions">
                  <AddSetupForm
                      symbol={symbol}
                      broker={broker}
                      onTradeAdded={handleTradeAdded}
                      disabled={loading}
                  />
                </div>

                {!loading && !error && tradeData.length > 0 && (
                    <div className="setups-data">
                      <TradeSummary tradeData={tradeData} />
                      <TradesTable
                          tradeData={tradeData}
                          symbol={symbol}
                          broker={broker}
                      />
                    </div>
                )}

                {!loading && !error && tradeData.length === 0 && (
                    <div className="no-data-message">
                      <p>No setups found for {symbol}.</p>
                      <p>Click "Add New Setup" to create one.</p>
                    </div>
                )}

                {loading && (
                    <div className="loading-indicator">
                      <p>Loading setups...</p>
                    </div>
                )}
              </div>
            </div>
        )}
      </div>
  );
};
