// TickerSearch.tsx
import React, { useState, useEffect, useRef } from 'react';

interface Ticker {
    ticker: string;
    name: string;
    market: string;
    locale: string;
    active: boolean;
    currency_symbol?: string;
    currency_name?: string;
    base_currency_symbol?: string;
    base_currency_name?: string;
    last_updated_utc: string;
}

interface TickerSearchProps {
    onTickerSelect: (ticker: string) => void;
    initialValue?: string;
}

const TickerSearch: React.FC<TickerSearchProps> = ({ onTickerSelect, initialValue = '' }) => {
    const [tickersMap, setTickersMap] = useState<Map<string, Ticker>>(new Map());
    const [searchInput, setSearchInput] = useState(initialValue);
    const [filteredTickers, setFilteredTickers] = useState<Ticker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch tickers on component mount
    useEffect(() => {
        const fetchTickersForMarket = async (market: string, apiKey: string, tickersMap: Map<string, Ticker>) => {
            let nextUrl = `https://api.polygon.io/v3/reference/tickers?market=${market}&active=true&order=asc&limit=1000&sort=ticker&apiKey=${apiKey}`;

            while (nextUrl) {
                const response = await fetch(nextUrl);

                if (!response.ok) {
                    throw new Error(`API request failed for ${market} market: ${response.status}`);
                }

                const data = await response.json();

                if (data.results && Array.isArray(data.results)) {
                    data.results.forEach((ticker: Ticker) => {
                        tickersMap.set(ticker.ticker, ticker);
                    });
                }

                // Check if there's a next_url in the response
                if (data.next_url) {
                    // Add the API key to the next_url
                    const nextUrlObj = new URL(data.next_url);
                    nextUrlObj.searchParams.append('apiKey', apiKey);
                    nextUrl = nextUrlObj.toString();
                } else {
                    nextUrl = '';
                }

                // // Limit the number of API calls to avoid rate limits
                // if (tickersMap.size >= 7500) {
                //     console.log(`Reached maximum ticker limit for ${market}`);
                //     break;
                // }
            }

            return tickersMap;
        };

        const fetchTickers = async () => {
            setIsLoading(true);
            setError(null);
            const tickersMap = new Map<string, Ticker>();

            try {
                // Get API key from environment variable
                const apiKey = import.meta.env.VITE_POLYGON_API_KEY;

                if (!apiKey) {
                    throw new Error('VITE_POLYGON_API_KEY environment variable is not set');
                }

                // Define markets to fetch
                const markets = ['fx', 'stocks', 'crypto'];

                // Process each market
                for (const market of markets) {
                    console.log(`Fetching tickers for ${market} market...`);
                    try {
                        await fetchTickersForMarket(market, apiKey, tickersMap);
                    } catch (marketError) {
                        console.error(`Error fetching ${market} tickers:`, marketError);
                        // Continue with other markets even if one fails
                    }
                }

                console.log(`Total tickers fetched: ${tickersMap.size}`);
                setTickersMap(tickersMap);
            } catch (err) {
                console.error('Error fetching tickers:', err);
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setIsLoading(false);
            }
        };

        fetchTickers();
    }, []);


    // Filter tickers based on search input
    useEffect(() => {
        if (searchInput.trim() === '') {
            setFilteredTickers([]);
            return;
        }

        const lowerCaseSearch = searchInput.toLowerCase();
        const results = Array.from(tickersMap.values()).filter(ticker =>
            ticker.ticker.toLowerCase().includes(lowerCaseSearch) ||
            ticker.name.toLowerCase().includes(lowerCaseSearch)
        );

        // Limit results to avoid performance issues
        setFilteredTickers(results.slice(0, 10));
    }, [searchInput, tickersMap]);

    // Handle clicks outside of dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
        setShowDropdown(true);
    };

    const handleTickerSelect = (ticker: Ticker) => {
        setSearchInput(ticker.ticker);
        onTickerSelect(ticker.ticker);
        setShowDropdown(false);
    };

    return (
        <div className="ticker-search-container">
            <div className="ticker-search-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchInput}
                    onChange={handleInputChange}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search ticker or company name..."
                    className="ticker-search-input"
                    disabled={isLoading}
                />
                {isLoading && <div className="ticker-loading-indicator">Loading tickers...</div>}
            </div>

            {error && <div className="ticker-error-message">{error}</div>}

            {showDropdown && filteredTickers.length > 0 && (
                <div ref={dropdownRef} className="ticker-dropdown">
                    {filteredTickers.map((ticker) => (
                        <div
                            key={ticker.ticker}
                            className="ticker-item"
                            onClick={() => handleTickerSelect(ticker)}
                        >
                            <div className="ticker-symbol">{ticker.ticker}</div>
                            <div className="ticker-name">{ticker.name}</div>
                        </div>
                    ))}
                </div>
            )}

            {showDropdown && searchInput && filteredTickers.length === 0 && !isLoading && (
                <div className="ticker-no-results">No matching tickers found</div>
            )}
        </div>
    );
};

export default TickerSearch;