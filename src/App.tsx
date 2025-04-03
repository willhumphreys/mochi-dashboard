// src/App.tsx
import { useAuth } from './AuthContext';
import { useState, useCallback } from 'react';
import './App.css';
import StockTreeView from "./StockTreeView";
import StrategyVisualization from "./StrategyVisualization";
import Dashboard from "./Dashboard";
import DashboardTitle from "./DashboardTitle";
import MergedTable from "./MergedTable";
import BacktestRequest from './BacktestRequest'; // Import the new component
import { MergedData } from "./types";
import Login from './Login';

function App() {
    const { isAuthenticated, isLoading, user, signOut } = useAuth();
    type User = { attributes?: { email?: string } };
    const [selectedStrategy, setSelectedStrategy] = useState<MergedData | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [showBacktestForm, setShowBacktestForm] = useState<boolean>(false); // State to toggle backtest form

    const handleStrategySelect = useCallback((row: MergedData) => {
        setSelectedStrategy(row);
    }, []);

    const handleSymbolSelect = useCallback((symbol: string | null) => {
        setSelectedSymbol(symbol);
        // Clear selected strategy when just a symbol is selected
        setSelectedStrategy(null);
    }, []);

    // Show loading state
    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    // Show login if not authenticated
    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <div className="App">
            <div className="app-header">
                <DashboardTitle title="Strategy Performance Dashboard 2" />
                <div className="user-info">
                    <span>Welcome, {(user as User).attributes?.email || 'User'}</span>
                    <button onClick={signOut} className="sign-out-button">Sign Out</button>
                </div>
            </div>

            {/* Backtest section */}
            <div className="backtest-section">
                <div className="backtest-header">
                    <h2>Backtest Tools</h2>
                    <button
                        onClick={() => setShowBacktestForm(!showBacktestForm)}
                        className="toggle-backtest-button"
                    >
                        {showBacktestForm ? 'Hide Backtest Form' : 'Show Backtest Form'}
                    </button>
                </div>

                {showBacktestForm && <BacktestRequest />}
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