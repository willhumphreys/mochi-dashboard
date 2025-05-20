// App.tsx (modified version)
import { useAuth } from './AuthContext';
import { useState, useCallback } from 'react';
import './App.css';
import StockTreeView from "./StockTreeView";
import StrategyVisualization from "./StrategyVisualization";
import Dashboard from "./Dashboard";
import DashboardTitle from "./DashboardTitle";
import MergedTable from "./MergedTable";
import BacktestRequest from './BacktestRequest';
import {SetupsViewer} from './SetupsViewer.tsx';
import BrokerManager from './BrokerManager.tsx';
import SecFilingsViewer from './SecFilingsViewer'; // Import the SEC filings viewer
import { MergedData } from "./types";
import Login from './Login';

function App() {
    const { isAuthenticated, isLoading, user, signOut } = useAuth();
    type User = { attributes?: { email?: string } };
    const [selectedStrategy, setSelectedStrategy] = useState<MergedData | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [showBacktestForm, setShowBacktestForm] = useState<boolean>(false);
    const [showSetups, setShowSetups] = useState<boolean>(false);
    const [showBrokerManager, setShowBrokerManager] = useState<boolean>(false); // State for broker manager
    const [showSecFilings, setShowSecFilings] = useState<boolean>(false); // State for SEC filings viewer

    const handleStrategySelect = useCallback((row: MergedData) => {
        setSelectedStrategy(row);
    }, []);

    const handleSymbolSelect = useCallback((symbol: string | null) => {
        setSelectedSymbol(symbol);
        // Clear selected strategy when just a symbol is selected
        setSelectedStrategy(null);
    }, []);

    const handleSetupsSymbolChange = useCallback((symbol: string) => {
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

            {/* Tools section with all toggles */}
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
                            onClick={() => setShowSetups(!showSetups)}
                            className="toggle-button"
                        >
                            {showSetups ? 'Hide Setups' : 'Show Setups'}
                        </button>
                        <button
                            onClick={() => setShowBrokerManager(!showBrokerManager)}
                            className="toggle-button"
                        >
                            {showBrokerManager ? 'Hide Broker Manager' : 'Manage Brokers'}
                        </button>
                        <button
                            onClick={() => setShowSecFilings(!showSecFilings)}
                            className="toggle-button"
                        >
                            {showSecFilings ? 'Hide SEC Filings' : 'Show SEC Filings'}
                        </button>
                    </div>
                </div>

                {showBacktestForm && <BacktestRequest />}
                {showSetups && <SetupsViewer
                    initialSymbol={selectedSymbol || 'AAPL'}
                    onSymbolChange={handleSetupsSymbolChange}
                />}
                {showBrokerManager && <BrokerManager />}
                {showSecFilings && <SecFilingsViewer />}
            </div>

            <div className="app-content">
                <Dashboard
                    tableComponent={<StockTreeView
                        onRowSelect={handleStrategySelect}
                        onSymbolSelect={handleSymbolSelect}
                    />}
                    visualizationComponent={
                        selectedStrategy ? (
                            <StrategyVisualization selectedStrategy={selectedStrategy} datasource="polygon" />
                        ) : selectedSymbol ? (
                            <MergedTable
                                symbol={selectedSymbol}
                                onRowSelect={handleStrategySelect}
                                datasource="polygon"
                            />
                        ) : null
                    }
                />
            </div>
        </div>
    );
}

export default App;
