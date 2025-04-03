// src/components/BacktestRequest.tsx
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
    const [params, setParams] = useState<BacktestParams>({
        ticker: 'TSLA',
        from_date: '2020-04-01',
        to_date: '2023-03-28'
    });
    const [result, setResult] = useState<BacktestSuccessResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<'pending' | 'submitted' | 'error'>('pending');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setParams({
            ...params,
            [name]: value
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
            setJobStatus('pending');

            // Get the authentication token from Cognito
            const authSession = await fetchAuthSession();
            const token = authSession.tokens?.idToken?.toString();

            if (!token) {
                throw new Error('No authentication token available');
            }

            // Make the backtest API request
            const response = await fetch(
                'https://6a3jgki3ul.execute-api.eu-central-1.amazonaws.com/prod/backtest',
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
            setJobStatus('submitted');
            console.log('Backtest job submitted successfully:', data);
        } catch (err) {
            console.error('Backtest error:', err);
            setError(err instanceof Error ? err.message : String(err));
            setJobStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setResult(null);
        setError(null);
        setJobStatus('pending');
    };

    return (
        <div className="backtest-container">
            <h2>Run Stock Backtest</h2>

            {!isAuthenticated && !isLoading && (
                <div className="auth-warning">
                    You need to be logged in to run backtests
                </div>
            )}

            {jobStatus !== 'submitted' && (
                <form onSubmit={handleSubmit} className="backtest-form">
                    <div className="form-group">
                        <label htmlFor="ticker">Ticker Symbol:</label>
                        <input
                            type="text"
                            id="ticker"
                            name="ticker"
                            value={params.ticker}
                            onChange={handleInputChange}
                            placeholder="TSLA"
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

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading || isLoading || !isAuthenticated}
                    >
                        {loading ? 'Submitting Job...' : 'Run Backtest'}
                    </button>
                </form>
            )}

            {error && (
                <div className="error-message">
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button onClick={resetForm} className="retry-button">
                        Try Again
                    </button>
                </div>
            )}

            {loading && (
                <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Submitting backtest job, please wait...</p>
                </div>
            )}

            {result && (
                <div className="success-container">
                    <h3>Job Successfully Submitted</h3>
                    <div className="job-details">
                        <div className="job-detail">
                            <span className="detail-label">Status:</span>
                            <span className="detail-value">{result.message}</span>
                        </div>
                        <div className="job-detail">
                            <span className="detail-label">Ticker:</span>
                            <span className="detail-value">{params.ticker}</span>
                        </div>
                        <div className="job-detail">
                            <span className="detail-label">Date Range:</span>
                            <span className="detail-value">{params.from_date} to {params.to_date}</span>
                        </div>
                        <div className="job-detail">
                            <span className="detail-label">Group Tag:</span>
                            <span className="detail-value highlight">{result.groupTag}</span>
                        </div>
                        <div className="job-detail">
                            <span className="detail-label">Polygon Job ID:</span>
                            <span className="detail-value">{result.polygonJobId}</span>
                        </div>
                        <div className="job-detail">
                            <span className="detail-label">Enhance Job ID:</span>
                            <span className="detail-value">{result.enhanceJobId}</span>
                        </div>
                    </div>
                    <p className="job-notice">
                        Your backtest is now processing. You'll be notified when the results are ready.
                    </p>
                    <button onClick={resetForm} className="new-job-button">
                        Submit Another Backtest
                    </button>
                </div>
            )}
        </div>
    );
};

export default BacktestRequest;