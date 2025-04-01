// src/App.tsx
import { useState, useCallback } from 'react';
import './App.css';
import StockTreeView from "./StockTreeView";
import StrategyVisualization from "./StrategyVisualization";
import Dashboard from "./Dashboard";
import DashboardTitle from "./DashboardTitle";
import MergedTable from "./MergedTable";
import { MergedData } from "./types";

function App() {
    const [selectedStrategy, setSelectedStrategy] = useState<MergedData | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    const handleStrategySelect = useCallback((row: MergedData) => {
        setSelectedStrategy(row);
    }, []);

    const handleSymbolSelect = useCallback((symbol: string | null) => {
        setSelectedSymbol(symbol);
        // Clear selected strategy when just a symbol is selected
        setSelectedStrategy(null);
    }, []);

    return (
        <div className="App">
            <div className="app-header">
                <DashboardTitle title="Strategy Performance Dashboard" />
            </div>

            <div className="app-content">
                <Dashboard
                    tableComponent={<StockTreeView
                        onRowSelect={handleStrategySelect}
                        onSymbolSelect={handleSymbolSelect}
                    />}
                    visualizationComponent={
                        selectedStrategy ? (
                            <StrategyVisualization selectedStrategy={selectedStrategy} />
                        ) : selectedSymbol ? (
                            <MergedTable
                                symbol={`${selectedSymbol}_polygon_min`}
                                onRowSelect={handleStrategySelect}
                            />
                        ) : (
                            <div className="empty-state">Select a stock symbol or strategy to view details</div>
                        )
                    }
                />
            </div>
        </div>
    );
}

export default App;