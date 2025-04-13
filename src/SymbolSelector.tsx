// SymbolSelector.tsx
interface SymbolSelectorProps {
  onSymbolChange: (symbol: string) => void;
  availableSymbols: string[];
  currentSymbol: string;
  loading: boolean;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
                                                           onSymbolChange,
                                                           availableSymbols,
                                                           currentSymbol,
                                                           loading
                                                       }) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSymbolChange(e.target.value);
    };

    return (
        <>
            <label htmlFor="symbol-select">Select Symbol:</label>
            <select
                id="symbol-select"
                value={currentSymbol}
                onChange={handleChange}
                disabled={loading || availableSymbols.length === 0}
            >
                {loading && <option value="">Loading symbols...</option>}
                {!loading && availableSymbols.length === 0 && (
                    <option value="">No symbols available</option>
                )}
                {availableSymbols.map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                ))}
            </select>
        </>
    );
};
export default SymbolSelector;