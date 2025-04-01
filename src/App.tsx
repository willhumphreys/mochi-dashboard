// src/App.tsx
import { useState, useCallback } from 'react';
import './App.css';
import StockTreeView from "./StockTreeView";
import StrategyVisualization from "./StrategyVisualization";
import Dashboard from "./Dashboard";
import DashboardTitle from "./DashboardTitle";
import { MergedData } from "./types";

function App() {
    const [selectedStrategy, setSelectedStrategy] = useState<MergedData | null>(null);

    const handleStrategySelect = useCallback((row: MergedData) => {
        setSelectedStrategy(row);
    }, []);

    return (
        <div className="App">
            <div className="app-header">
                <DashboardTitle title="Strategy Performance Dashboard" />
            </div>

            <div className="app-content">
                <Dashboard
                    tableComponent={<StockTreeView onRowSelect={handleStrategySelect} />}
                    visualizationComponent={<StrategyVisualization selectedStrategy={selectedStrategy} />}
                />
            </div>
        </div>
    );
}

export default App;