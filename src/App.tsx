// src/App.tsx
import { useAuth } from './AuthContext';
import { useState, useCallback } from 'react';
import './App.css';
import StockTreeView from "./StockTreeView";
import StrategyVisualization from "./StrategyVisualization";
import Dashboard from "./Dashboard";
import DashboardTitle from "./DashboardTitle";
import MergedTable from "./MergedTable";
import BacktestRequest from './BacktestRequest';
import LiveTradesViewer from './LiveTradesViewer'; // Import the LiveTradesViewer component
import { MergedData } from "./types";
import Login from './Login';

function App() {
    const { isAuthenticated, isLoading, user, signOut } = useAuth();
    type User = { attributes?: { email?: string } };
    const [selectedStrategy, setSelectedStrategy] = useState<MergedData | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [showBacktestForm, setShowBacktestForm] = useState<boolean>(false);
    const [showLiveTrades, setShowLiveTrades] = useState<boolean>(false); // State to toggle live trades view

    const handleStrategySelect = useCallback((row: MergedData) => {
        setSelectedStrategy(row);
    }, []);

    const handleSymbolSelect = useCallback((symbol: string | null) => {
        setSelectedSymbol(symbol);
        // Clear selected strategy when just a symbol is selected
        setSelectedStrategy(null);
    }, []);

    const handleLiveTradeSymbolChange = useCallback((symbol: string) => {
        console.log(`Live trades symbol changed to: ${symbol}`);
        // You can add additional handling here if needed
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
                <DashboardTitle title="Mochi Dashboard" />
                <div className="user-info">
                    <span>Welcome, {(user as User).attributes?.email || 'User'}</span>
                    <button onClick={signOut} className="sign-out-button">Sign Out</button>
                </div>
            </div>

            {/* Tools section with both backtest and live trades toggles */}
            <div className="tools-section">
                <div className="tools-header">
                    <h2>Trading Tools</h2>
                    <div className="tools-buttons">
                        <button
                            onClick={() => setShowBacktestForm(!showBacktestForm)}
                            className="toggle-button"
                        >
                            {showBacktestForm ? 'Hide Backtest Form' : 'Show Backtest Form'}
                        </button>
                        <button
                            onClick={() => setShowLiveTrades(!showLiveTrades)}
                            className="toggle-button"
                        >
                            {showLiveTrades ? 'Hide Live Trades' : 'Show Live Trades'}
                        </button>
                    </div>
                </div>

                {showBacktestForm && <BacktestRequest />}
                {showLiveTrades && <LiveTradesViewer
                    initialSymbol={selectedSymbol || 'AAPL'}
                    onSymbolChange={handleLiveTradeSymbolChange}
                />}
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