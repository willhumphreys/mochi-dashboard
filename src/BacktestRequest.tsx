import React, { useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuth } from './AuthContext';

interface BacktestParams {
    ticker: string;
    from_date: string;
    to_date: string;
}

interface BacktestSuccessResponse {
    message: string;
    polygonJobId: string;
    enhanceJobId: string;
    groupTag: string;
}

interface BacktestErrorResponse {
    message: string;
}

const BacktestRequest: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // Get today's date and format it as YYYY-MM-DD
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    // Calculate date presets, ensuring to start from the next full day
    const calculateFromDate = (yearsBack: number): string => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - yearsBack);

        // Skip the partial day and start from the next full day
        date.setDate(date.getDate() + 1);

        return date.toISOString().split('T')[0];
    };

    // Date presets
    const datePresets = {
        '1 Year': calculateFromDate(1),
        '5 Years': calculateFromDate(5),
        '10 Years': calculateFromDate(10),
        '20 Years': calculateFromDate(20),
        '30 Years': calculateFromDate(30)
    };

    // Default to 5 years
    const [params, setParams] = useState<BacktestParams>({
        ticker: 'TSLA',
        from_date: datePresets['5 Years'],
        to_date: formattedToday
    });

    const [result, setResult] = useState<BacktestSuccessResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setParams({
            ...params,
            [name]: value
        });
    };

    // Handle preset selection
    const handlePresetSelect = (preset: keyof typeof datePresets) => {
        setParams({
            ...params,
            from_date: datePresets[preset]
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            setError('You must be logged in to run a backtest');
            return;
        }

        if (isLoading) {
            setError('Authentication is still loading, please wait');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResult(null);

            // Get the authentication token from Cognito
            const authSession = await fetchAuthSession();
            const token = authSession.tokens?.idToken?.toString();

            if (!token) {
                throw new Error('No authentication token available');
            }

            // Make the backtest API request
            const response = await fetch(
                '/api/backtest',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(params)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                // Parse error response
                const errorResponse = data as BacktestErrorResponse;
                throw new Error(errorResponse.message || `API request failed: ${response.status}`);
            }

            // Handle success response
            setResult(data as BacktestSuccessResponse);
            console.log('Backtest job submitted successfully:', data);
        } catch (err) {
            console.error('Backtest error:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setResult(null);
        setError(null);
    };

    return (
        <div className="backtest-container">
            <h2>Run Backtest</h2>

            {!isAuthenticated && !isLoading && (
                <div className="auth-warning">
                    Please log in to run a backtest.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="ticker">Stock Symbol:</label>
                    <input
                        type="text"
                        id="ticker"
                        name="ticker"
                        value={params.ticker}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="from_date">From Date:</label>
                    <input
                        type="date"
                        id="from_date"
                        name="from_date"
                        value={params.from_date}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="to_date">To Date:</label>
                    <input
                        type="date"
                        id="to_date"
                        name="to_date"
                        value={params.to_date}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="date-presets">
                    <label>Preset Time Ranges:</label>
                    <div className="preset-buttons">
                        {Object.keys(datePresets).map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => handlePresetSelect(preset as keyof typeof datePresets)}
                                className={params.from_date === datePresets[preset as keyof typeof datePresets] ? 'active' : ''}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading || !isAuthenticated}>
                        {loading ? 'Submitting...' : 'Run Backtest'}
                    </button>
                    {result && <button type="button" onClick={resetForm}>New Backtest</button>}
                </div>
            </form>

            {loading && <div className="loading">Submitting backtest job...</div>}

            {error && (
                <div className="error-message">
                    <h3>Error:</h3>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="success-message">
                    <h3>Backtest Job Submitted:</h3>
                    <p>{result.message}</p>
                    <div className="job-details">
                        <p><strong>Group Tag:</strong> {result.groupTag}</p>
                        <p><strong>Polygon Job ID:</strong> {result.polygonJobId}</p>
                        <p><strong>Enhance Job ID:</strong> {result.enhanceJobId}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BacktestRequest;