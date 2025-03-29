// src/types.ts

export interface FilteredSetupRow {
    Rank: number;
    scenario: string;
    traderid: number;
    totalprofit: string;
    tradecount: string;
    besttrade: string;
    worsttrade: string;
    profit_stddev: string;
    wincount: string;
    losecount: string;
    averagenetprofit: string;
    dayofweek: number
    hourofday: number
    stop: number
    limit: number
    tickoffset: number
    tradeduration: number
    outoftime: number
}

export interface AggregatedSummaryRow {
    Rank: number;
    Scenario: string;
    TraderID: number;
    MaxDrawdown: string;
    MaxProfit: string;
    ProfitFactor: string;
    CompositeScore: string;
    RiskRewardBalance: string;
}

export interface MergedData {
    Rank: number;
    Scenario: string;
    TraderID: number;
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
    dayofweek: number
    hourofday: number
    stop: number
    limit: number
    tickoffset: number
    tradeduration: number
    outoftime: number
}

export interface TraderConfigDetails {
    rank: number;
    dayofweek: number;
    hourofday: number;
    stop: number;
    limit: number;
    tickoffset: number;
    tradeduration: number;
    outoftime: number;
}

