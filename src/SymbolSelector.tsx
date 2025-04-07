// src/components/SymbolSelector.tsx
import { useState, useEffect } from 'react';
import { getLiveTradeSymbols } from './services/S3Service';

interface SymbolSelectorProps {
  initialSymbol?: string;
  onSymbolChange: (symbol: string) => void;
  disabled?: boolean;
  refreshTrigger?: number; // Added: A number that changes when we need to refresh
}

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({
                                                                initialSymbol = 'AAPL',
                                                                onSymbolChange,
                                                                disabled = false,
                                                                refreshTrigger = 0 // Default value
                                                              }) => {
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>(initialSymbol);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        setLoading(true);
        const symbols = await getLiveTradeSymbols(true); // Force cache refresh
        setAvailableSymbols(symbols);

        // Set default symbol if the initial one is not available
        if (symbols.length > 0 && !symbols.includes(symbol)) {
          const newSymbol = symbols[0];
          setSymbol(newSymbol);
          onSymbolChange(newSymbol);
        }
        setLoading(false);
      } catch (err) {
        setError(`Failed to load available symbols: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchSymbols();
  }, [initialSymbol, refreshTrigger]); // Added refreshTrigger to dependencies

  const handleSymbolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSymbol = event.target.value;
    setSymbol(newSymbol);
    onSymbolChange(newSymbol);
  };

  return (
      <div className="symbol-selector-container">
        <div className="symbol-selector">
          <label htmlFor="symbol-select">Select Symbol:</label>
          <select
              id="symbol-select"
              value={symbol}
              onChange={handleSymbolChange}
              disabled={disabled || loading || availableSymbols.length === 0}
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

        {loading && <div className="loading">Loading symbols...</div>}
        {error && <div className="error">{error}</div>}
      </div>
  );
};

export default SymbolSelector;