// src/App.tsx
import { useState } from 'react';
import './App.css';
import MergedTable from "./MergedTable";
import StrategyVisualization from "./StrategyVisualization";
import Dashboard from "./Dashboard";
import { MergedData } from "./types";

function App() {
    const [selectedStrategy, setSelectedStrategy] = useState<MergedData | null>(null);

    const handleStrategySelect = (row: MergedData) => {
        setSelectedStrategy(row);
    };

    return (
        <div className="App">
            <Dashboard
                title="Strategy Performance Dashboard"
                tableComponent={<MergedTable onRowSelect={handleStrategySelect} />}
                visualizationComponent={<StrategyVisualization selectedStrategy={selectedStrategy} />}
            />
        </div>
    );
}

export default App;