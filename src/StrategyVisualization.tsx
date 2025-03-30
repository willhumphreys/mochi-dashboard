import { useEffect, useState } from "react";
import { MergedData, TraderConfigDetails } from "./types";
import { getS3ImageUrl, getDirectS3Url } from "./services/S3Service";
import TraderDetailsTable from "./TraderConfigurationDetails";

interface StrategyVisualizationProps {
    selectedStrategy: MergedData | null;
}

const StrategyVisualization = ({ selectedStrategy }: StrategyVisualizationProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [usedDirectUrl, setUsedDirectUrl] = useState<boolean>(false);

    // Add state for trader configuration
    const [traderConfig, setTraderConfig] = useState<TraderConfigDetails>({
        rank: 0,
        dayofweek: 0,
        hourofday: 0,
        stop: 0,
        limit: 0,
        tickoffset: 0,
        tradeduration: 0,
        outoftime: 0
    });

    // Add loading state for trader config
    const [configLoading, setConfigLoading] = useState<boolean>(false);

    useEffect(() => {
        // Reset state when strategy changes
        setImageUrl(null);
        setLoading(false);
        setError(null);
        setUsedDirectUrl(false);

        if (!selectedStrategy) {
            return;
        }

        const loadImage = async () => {
            try {
                setLoading(true);
                setError(null);

                // Construct the S3 key based on selectedStrategy
                const key = constructS3Key(selectedStrategy);

                if (!key) {
                    throw new Error("Unable to construct valid S3 key from selected strategy");
                }

                console.log("Constructed S3 key:", key);

                try {
                    // First try with pre-signed URL
                    const url = await getS3ImageUrl(key);
                    setImageUrl(url);
                } catch (presignError) {
                    console.error("Failed to get pre-signed URL:", presignError);

                    // Fallback: Try direct URL if pre-signed URL fails
                    console.log("Falling back to direct S3 URL...");
                    const directUrl = getDirectS3Url(key);
                    setImageUrl(directUrl);
                    setUsedDirectUrl(true);
                }
            } catch (err) {
                console.error("Failed to load strategy image:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        loadImage();

        // Add logic to fetch trader configuration
        const fetchTraderConfig = async () => {
            if (!selectedStrategy) return;

            setConfigLoading(true);
            try {
                // In a real application, you would fetch this data from an API
                // For now, we'll use the data from the selectedStrategy
                const config: TraderConfigDetails = {
                    rank: selectedStrategy.Rank,
                    dayofweek: selectedStrategy.dayofweek || 0,
                    hourofday: selectedStrategy.hourofday || 0,
                    stop: selectedStrategy.stop || 0,
                    limit: selectedStrategy.limit || 0,
                    tickoffset: selectedStrategy.tickoffset || 0,
                    tradeduration: selectedStrategy.tradeduration || 0,
                    outoftime: selectedStrategy.outoftime || 0
                };

                setTraderConfig(config);
            } catch (err) {
                console.error("Failed to fetch trader configuration:", err);
            } finally {
                setConfigLoading(false);
            }
        };

        fetchTraderConfig();
    }, [selectedStrategy]);

    // Function to construct the S3 key from selected strategy
    const constructS3Key = (strategy: MergedData): string => {
        if (!strategy) {
            return "";
        }

        // Extract the symbol
        const symbol = strategy.Symbol + '_polygon_min';

        const scenarioString = strategy.Scenario;

        // Construct the final key format: symbol/graphs/symbol_scenarioString_traderID.png
        return `${symbol}/graphs/${symbol}_${scenarioString}_${strategy.TraderID}.png`;
    };

    // Function to handle image load error
    const handleImageError = () => {
        if (!usedDirectUrl) {
            // If we haven't tried direct URL yet, fall back to it
            const directUrl = getDirectS3Url(constructS3Key(selectedStrategy!));
            setImageUrl(directUrl);
            setUsedDirectUrl(true);
            console.log("Pre-signed URL failed to load image, falling back to direct URL");
        } else {
            setError("Failed to load image from both pre-signed and direct URLs");
        }
    };

    if (!selectedStrategy) {
        return <div className="strategy-placeholder">Select a strategy to view details</div>;
    }

    return (
        <div className="strategy-visualization">
            <h3>Strategy Visualization</h3>

            {/* Add TraderConfigurationDetails component */}
            <div className="trader-details-section">
                {configLoading ? (
                    <div className="loading-indicator">Loading trader configuration...</div>
                ) : (
                    <TraderDetailsTable configDetails={traderConfig} />
                )}
            </div>

            {loading && <div className="loading">Loading visualization...</div>}

            {error && (
                <div className="error">
                    <p>Error loading visualization: {error}</p>
                </div>
            )}

            {imageUrl && !loading && !error && (
                <div className="image-container">
                    <img
                        src={imageUrl}
                        alt={`Strategy ${selectedStrategy.Scenario}-${selectedStrategy.TraderID} visualization`}
                        onError={handleImageError}
                    />
                </div>
            )}

            <div className="strategy-details">
                <h4>Details for Strategy {selectedStrategy.Scenario} (Trader {selectedStrategy.TraderID})</h4>
                <p>Total Profit: {selectedStrategy.totalprofit}</p>
                <p>Trade Count: {selectedStrategy.tradecount}</p>
                <p>Win/Loss: {selectedStrategy.wincount}/{selectedStrategy.losecount}</p>
                {selectedStrategy.ProfitFactor && <p>Profit Factor: {selectedStrategy.ProfitFactor}</p>}
                {selectedStrategy.MaxDrawdown && <p>Max Drawdown: {selectedStrategy.MaxDrawdown}</p>}
            </div>
        </div>
    );
};

export default StrategyVisualization;