// src/types.ts

export interface AggregatedSummaryRow {
    Scenario: string;
    TraderID: string;
    TotalProfit: number;
    TradeCount: number;
    BestTrade: number;
    WorstTrade: number;
    ProfitStdDev: number;
    WinCount: number;
    LoseCount: number;
    AverageNetProfit: number;
    MaxDrawdown: number;
    MaxProfit: number;
    ProfitFactor: number;
}

export interface FilteredSetupRow {
    Scenario: string;
    TraderID: string;
    Setup: string;
    Entry: number;
    Exit: number;
    Profit: number;
    Date: string;
}


export interface MergedData extends AggregatedSummaryRow {
    Rank: number;
    Setups: FilteredSetupRow[];
    GraphFile: string;
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

