// src/StockTreeView.tsx
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { AggregatedSummaryRow, FilteredSetupRow, MergedData } from "./types";
import { getDirectS3Url, getS3ImageUrl } from "./services/S3Service";

interface StockTreeViewProps {
  onRowSelect: (row: MergedData) => void;
}

interface StockData {
  symbol: string;
  isExpanded: boolean;
  data: MergedData[];
  isLoading: boolean;
  error: string | null;
}

const STOCK_SYMBOLS = ["AAPL", "GOOG"]; // You can add more symbols here

const StockTreeView = ({ onRowSelect }: StockTreeViewProps) => {
  const [stocksData, setStocksData] = useState<Record<string, StockData>>({});

  useEffect(() => {
    // Initialize the stocks data structure
    const initialStocksData: Record<string, StockData> = {};
    STOCK_SYMBOLS.forEach(symbol => {
      initialStocksData[symbol] = {
        symbol,
        isExpanded: false,
        data: [],
        isLoading: false,
        error: null
      };
    });

    setStocksData(initialStocksData);
  }, []);

  const toggleSymbol = async (symbol: string) => {
    // Toggle expansion state
    setStocksData(prevData => ({
      ...prevData,
      [symbol]: {
        ...prevData[symbol],
        isExpanded: !prevData[symbol].isExpanded
      }
    }));

    // If we're expanding and no data is loaded yet, load the data
    if (!stocksData[symbol].isExpanded && stocksData[symbol].data.length === 0) {
      await loadStockData(symbol);
    }
  };

  const loadStockData = async (symbol: string) => {
    try {
      // Set loading state
      setStocksData(prevData => ({
        ...prevData,
        [symbol]: {
          ...prevData[symbol],
          isLoading: true,
          error: null
        }
      }));

      // Define the S3 paths for the CSV files based on the symbol
      let filteredSetupsKey: string;
      let aggregatedSummaryKey: string;

      if (symbol === "AAPL") {
        filteredSetupsKey = `${symbol}_polygon_min/filtered-setups.csv`;
        aggregatedSummaryKey = `${symbol}_polygon_min/aggregated_filtered_summary.csv`;
      } else {
        // For other symbols like GOOG, use the appropriate path
        filteredSetupsKey = `${symbol}_polygon_min/filtered-setups.csv`;
        aggregatedSummaryKey = `${symbol}_polygon_min/aggregated_filtered_summary.csv`;
      }

      // Get URLs for both CSV files
      let filteredSetupsUrl: string;
      let aggregatedSummaryUrl: string;

      try {
        // Try to get pre-signed URLs first
        filteredSetupsUrl = await getS3ImageUrl(filteredSetupsKey);
        aggregatedSummaryUrl = await getS3ImageUrl(aggregatedSummaryKey);
      } catch (error) {
        console.error(`Failed to get pre-signed URLs for ${symbol}, falling back to direct URLs:`, error);
        filteredSetupsUrl = getDirectS3Url(filteredSetupsKey);
        aggregatedSummaryUrl = getDirectS3Url(aggregatedSummaryKey);
      }

      // Fetch the CSV data using the generated URLs
      const [filteredSetupsResponse, aggregatedSummaryResponse] = await Promise.all([
        fetch(filteredSetupsUrl),
        fetch(aggregatedSummaryUrl)
      ]);

      if (!filteredSetupsResponse.ok) {
        throw new Error(`Failed to fetch filtered-setups.csv for ${symbol}: ${filteredSetupsResponse.statusText}`);
      }

      if (!aggregatedSummaryResponse.ok) {
        throw new Error(`Failed to fetch aggregated_filtered_summary.csv for ${symbol}: ${aggregatedSummaryResponse.statusText}`);
      }

      const filteredSetupsText = await filteredSetupsResponse.text();
      const aggregatedSummaryText = await aggregatedSummaryResponse.text();

      // Parse the CSV data
      const filteredSetupsData = Papa.parse<FilteredSetupRow>(filteredSetupsText, {
        header: true,
        skipEmptyLines: true,
      }).data;

      const aggregatedSummaryData = Papa.parse<AggregatedSummaryRow>(aggregatedSummaryText, {
        header: true,
        skipEmptyLines: true,
      }).data;

      console.log(`${symbol} filtered setups data:`, filteredSetupsData.length, "rows");
      console.log(`${symbol} aggregated summary data:`, aggregatedSummaryData.length, "rows");

      // Merge the data
      const mergedData = filteredSetupsData.map((setupRow) => {
        const summaryRow = aggregatedSummaryData.find((sr) => sr.Rank === setupRow.Rank);
        return {
          Rank: setupRow.Rank,
          Scenario: summaryRow?.Scenario || "N/A",
          TraderID: summaryRow?.TraderID || 0,
          MaxDrawdown: summaryRow?.MaxDrawdown || 0,
          MaxProfit: summaryRow?.MaxProfit || 0,
          ProfitFactor: summaryRow?.ProfitFactor || 0,
          CompositeScore: summaryRow?.CompositeScore || 0,
          RiskRewardBalance: summaryRow?.RiskRewardBalance || 0,
          Setup: setupRow.Setup,
          totalprofit: setupRow.totalprofit,
          tradecount: setupRow.tradecount,
          besttrade: setupRow.besttrade,
          worsttrade: setupRow.worsttrade,
          profit_stddev: setupRow.profit_stddev,
          wincount: setupRow.wincount,
          losecount: setupRow.losecount,
          winningticks: setupRow.winningticks,
          losingticks: setupRow.losingticks,
          averagenetprofit: setupRow.averagenetprofit,
          winningyears: setupRow.winningyears,
          dayofweek: setupRow.dayofweek,
          hourofday: setupRow.hourofday,
          stop: setupRow.stop,
          limit: setupRow.limit,
          tickoffset: setupRow.tickoffset,
          tradeduration: setupRow.tradeduration,
          outoftime: setupRow.outoftime,
          averagewinner: setupRow.averagewinner,
          averageloser: setupRow.averageloser,
          reward_risk_ratio: setupRow.reward_risk_ratio,
          cte_win_loss_ratio: setupRow.cte_win_loss_ratio,
          winnerprobability: setupRow.winnerprobability,
          loserprobability: setupRow.loserprobability,
          endurance_rank: setupRow.endurance_rank,
          pain_tolerance_rank: setupRow.pain_tolerance_rank,
          trend_reversal_rank: setupRow.trend_reversal_rank,
          appt: setupRow.appt,
          sharpe_ratio: setupRow.sharpe_ratio,
          modified_sharpe_ratio: setupRow.modified_sharpe_ratio,
          profit_to_max_drawdown_ratio: setupRow.profit_to_max_drawdown_ratio,
          profit_to_risk_ratio: setupRow.profit_to_risk_ratio,
          profit_factor: setupRow.profit_factor,
          Symbol: "AAPL", // Adding the symbol
          kelly_fraction: setupRow.kelly_fraction,
          coefficient_of_variation: setupRow.coefficient_of_variation,
          sortino_ratio: setupRow.sortino_ratio,
          profit_per_risk_ratio: setupRow.profit_per_risk_ratio,
          calmar_ratio: setupRow.calmar_ratio,
          recovery_factor: setupRow.recovery_factor,
          sterling_ratio: setupRow.sterling_ratio,
          max_drawdown_percentage: setupRow.max_drawdown_percentage,
          avg_profit_to_max_drawdown: setupRow.avg_profit_to_max_drawdown,
          max_drawdown_duration: setupRow.max_drawdown_duration,
          ulcer_index: setupRow.ulcer_index,
          pain_index: setupRow.pain_index,
          martin_ratio: setupRow.martin_ratio,
          drawdown_events_count: setupRow.drawdown_events_count,
          max_melt_up: setupRow.max_melt_up,
          max_melt_up_duration: setupRow.max_melt_up_duration,
          max_melt_up_percentage: setupRow.max_melt_up_percentage,
          melt_up_events_count: setupRow.melt_up_events_count,
          avg_melt_up: setupRow.avg_melt_up,
          max_consecutive_winners: setupRow.max_consecutive_winners,
          avg_consecutive_winners: setupRow.avg_consecutive_winners,
          max_consecutive_losers: setupRow.max_consecutive_losers,
          avg_consecutive_losers: setupRow.avg_consecutive_losers,
          max_drawdown: setupRow.max_drawdown,
          profitColumn: setupRow.profitColumn,
          hourDay: setupRow.hourDay

        }as MergedData;
      });

      // Update state with the loaded data
      setStocksData(prevData => ({
        ...prevData,
        [symbol]: {
          ...prevData[symbol],
          isLoading: false,
          data: mergedData,
        }
      }));

    } catch (error) {
      console.error(`Error loading data for ${symbol}:`, error);
      setStocksData(prevData => ({
        ...prevData,
        [symbol]: {
          ...prevData[symbol],
          isLoading: false,
          error: error instanceof Error ? error.message : String(error)
        }
      }));
    }
  };

  const handleRowClick = (row: MergedData) => {
    onRowSelect(row);
  };

  return (
      <div className="stock-tree-view">
        <h2>Stock Data</h2>
        <div className="tree-container">
          {Object.values(stocksData).map((stockData) => (
              <div key={stockData.symbol} className="stock-item">
                <div
                    className="stock-header"
                    onClick={() => toggleSymbol(stockData.symbol)}
                >
                  <span className="expander">{stockData.isExpanded ? '▼' : '►'}</span>
                  <span className="symbol-name">{stockData.symbol}</span>
                </div>

                {stockData.isLoading && (
                    <div className="loading-indicator">Loading...</div>
                )}

                {stockData.error && (
                    <div className="error-message">Error: {stockData.error}</div>
                )}

                {stockData.isExpanded && !stockData.isLoading && stockData.data.length > 0 && (
                    <table className="stock-data-table">
                      <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Scenario</th>
                        <th>CompositeScore</th>
                      </tr>
                      </thead>
                      <tbody>
                      {stockData.data.map((row) => (
                          <tr key={`${stockData.symbol}-${row.Rank}`} onClick={() => handleRowClick(row)}>
                            <td>{row.Rank}</td>
                            <td>{row.Scenario}</td>
                            <td>{row.CompositeScore}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                )}

                {stockData.isExpanded && !stockData.isLoading && stockData.data.length === 0 && !stockData.error && (
                    <div className="no-data">No data available</div>
                )}
              </div>
          ))}
        </div>
      </div>
  );
};

export default StockTreeView;