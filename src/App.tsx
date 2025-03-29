// src/App.tsx
import { useState, useCallback } from 'react';
import './App.css';
import MergedTable from "./MergedTable";
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
            {/* Container to ensure title stays fixed */}
            <div className="app-header">
                <DashboardTitle title="Strategy Performance Dashboard" />
            </div>

            {/* Main content container */}
            <div className="app-content">
                <Dashboard
                    tableComponent={<MergedTable onRowSelect={handleStrategySelect} />}
                    visualizationComponent={<StrategyVisualization selectedStrategy={selectedStrategy} />}
                />
            </div>
        </div>
    );
}

export default App;