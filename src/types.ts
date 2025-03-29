// src/types.ts

export interface FilteredSetupRow {
    Rank: string;
    scenario: string;
    traderid: string;
    totalprofit: string;
    tradecount: string;
    besttrade: string;
    worsttrade: string;
    profit_stddev: string;
    wincount: string;
    losecount: string;
    averagenetprofit: string;
}

export interface AggregatedSummaryRow {
    Rank: string;
    Scenario: string;
    TraderID: string;
    MaxDrawdown: string;
    MaxProfit: string;
    ProfitFactor: string;
    CompositeScore: string;
    RiskRewardBalance: string;
}

export interface MergedData {
    Rank: string;
    Scenario: string;
    TraderID: string;
    TotalProfit: string;
    TradeCount: string;
    BestTrade: string;
    WorstTrade: string;
    ProfitStdDev: string;
    WinCount: string;
    LoseCount: string;
    AverageNetProfit: string;
    MaxDrawdown?: string; // Optional in case of missing data
    MaxProfit?: string;   // Optional in case of missing data
    ProfitFactor?: string; // Optional in case of missing data
    CompositeScore?: string; // Optional in case of missing data
    RiskRewardBalance?: string; // Optional in case of missing data
}
