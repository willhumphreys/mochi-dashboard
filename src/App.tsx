// src/App.tsx
import { useState, useCallback } from 'react';
import './App.css';
import MergedTable from "./MergedTable";
import StrategyVisualization from "./StrategyVisualization";
import Dashboard from "./Dashboard";
import { MergedData } from "./types";

function App() {
    const [selectedStrategy, setSelectedStrategy] = useState<MergedData | null>(null);

    const handleStrategySelect = useCallback((row: MergedData) => {
        setSelectedStrategy(row);
    }, []);

    return (
        <div className="App">
            <h1 className="dashboard-title">Strategy Performance Dashboard</h1>
            <Dashboard
                tableComponent={<MergedTable onRowSelect={handleStrategySelect} />}
                visualizationComponent={<StrategyVisualization selectedStrategy={selectedStrategy} />}
            />
        </div>
    );
}

export default App;