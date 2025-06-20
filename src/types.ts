// src/types.ts
export interface AggregatedSummaryRow {
    Rank: number;
    Scenario: string;
    TraderID: number;
    MaxDrawdown: number;
    MaxProfit: number;
    ProfitFactor: number;
    CompositeScore: number;
    RiskRewardBalance: number;

}

export interface FilteredSetupRow {
    Scenario: string;
    TraderID: number;
    Rank: number;
    totalprofit: number;
    tradecount: number;
    besttrade: number;
    worsttrade: number;
    profit_stddev: number;
    wincount: number;
    losecount: number;
    winningticks: number;
    losingticks: number;
    averagenetprofit: number;
    winningyears: number;
    dayofweek: number;
    hourofday: number;
    stop: number;
    limit: number;
    stopped_trade_count: number;
    limit_trade_count: number;
    tickoffset: number;
    tradeduration: number;
    outoftime: number;
    averagewinner: number;
    averageloser: number;
    reward_risk_ratio: number;
    cte_win_loss_ratio: number;
    winnerprobability: number;
    loserprobability: number;
    endurance_rank: number;
    pain_tolerance_rank: number;
    trend_reversal_rank: number;
    appt: number;
    sharpe_ratio: number;
    modified_sharpe_ratio: number;
    profit_to_max_drawdown_ratio: number;
    profit_to_risk_ratio: number;
    profit_factor: number;
    kelly_fraction: number;
    coefficient_of_variation: number;
    sortino_ratio: number;
    profit_per_risk_ratio: number;
    calmar_ratio: number;
    recovery_factor: number;
    sterling_ratio: number;
    max_drawdown_percentage: number;
    avg_profit_to_max_drawdown: number;
    max_drawdown_duration: number;
    ulcer_index: number;
    pain_index: number;
    martin_ratio: number;
    drawdown_events_count: number;
    max_melt_up: number;
    max_melt_up_duration: number;
    max_melt_up_percentage: number;
    melt_up_events_count: number;
    avg_melt_up: number;
    max_consecutive_winners: number;
    avg_consecutive_winners: number;
    max_consecutive_losers: number;
    avg_consecutive_losers: number;
    max_drawdown: number;
    profitColumn: number;
    hourDay: number;
    Symbol: string;
}


export interface MergedData{
    Rank: number;
    Scenario: string;
    TraderID: number;
    MaxDrawdown: number;
    MaxProfit: number;
    ProfitFactor: number;
    CompositeScore: number;
    RiskRewardBalance: number;
    Setup: string;
    totalprofit: number;
    tradecount: number;
    besttrade: number;
    worsttrade: number;
    profit_stddev: number;
    wincount: number;
    losecount: number;
    winningticks: number;
    losingticks: number;
    averagenetprofit: number;
    winningyears: number;
    dayofweek: number;
    hourofday: number;
    stop: number;
    limit: number;
    stopped_trade_count: number;
    limit_trade_count: number;
    tickoffset: number;
    tradeduration: number;
    outoftime: number;
    averagewinner: number;
    averageloser: number;
    reward_risk_ratio: number;
    cte_win_loss_ratio: number;
    winnerprobability: number;
    loserprobability: number;
    endurance_rank: number;
    pain_tolerance_rank: number;
    trend_reversal_rank: number;
    appt: number;
    sharpe_ratio: number;
    modified_sharpe_ratio: number;
    profit_to_max_drawdown_ratio: number;
    profit_to_risk_ratio: number;
    profit_factor: number;
    kelly_fraction: number;
    coefficient_of_variation: number;
    sortino_ratio: number;
    profit_per_risk_ratio: number;
    calmar_ratio: number;
    recovery_factor: number;
    sterling_ratio: number;
    max_drawdown_percentage: number;
    avg_profit_to_max_drawdown: number;
    max_drawdown_duration: number;
    ulcer_index: number;
    pain_index: number;
    martin_ratio: number;
    drawdown_events_count: number;
    max_melt_up: number;
    max_melt_up_duration: number;
    max_melt_up_percentage: number;
    melt_up_events_count: number;
    avg_melt_up: number;
    max_consecutive_winners: number;
    avg_consecutive_winners: number;
    max_consecutive_losers: number;
    avg_consecutive_losers: number;
    max_drawdown: number;
    profitColumn: number;
    hourDay: number;
    Symbol: string;
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
    totalprofit?: number;
    tradecount?: number;
    wincount?: number;
    losecount?: number;
    besttrade?: number;
    worsttrade?: number;
    ProfitFactor?: number;
    averagenetprofit?: number;
    MaxProfit?: number;
    MaxDrawdown?: number;
    stopped_trade_count?: number;
    limit_trade_count?: number;
}

/**
 * Interface for trade data from CSV files
 */
export interface TradeData {
    id: number;
    traderid: number;
    dayofweek: number;
    hourofday: number;
    stop: number;
    limit: number;
    tickoffset: number;
    tradeduration: number;
    outoftime: number;

    [key: string]: string | number | boolean | undefined; // Allow additional fields with specific types
}

export interface TradeSetup {
    rank?: number;  // The CSV has an unnamed first column that appears to be the rank
    traderid: number;
    dayofweek: number;
    hourofday: number;
    stop: number;
    limit: number;
    stopped_trade_count: number;
    limit_trade_count: number;
    tickoffset: number;
    tradeduration: number;
    outoftime: number;
}

/**
 * Interface for SEC filing position data
 */
export interface SecPosition {
    Cusip: string;
    Issuer: string;
    Ticker: string;
    Class: string;
    TotalShares: number;
    TotalValue: number;
    Change?: number; // Change in shares from previous filing (calculated)
    PercentChange?: number; // Percentage change from previous filing (calculated)
}

/**
 * Interface for SEC filing metadata
 */
export interface SecFiling {
    personId: string; // ID of the person/entity (e.g., "1067983" for Warren Buffet)
    personName: string; // Name of the person/entity (e.g., "Warren Buffet")
    filingDate: string; // Date of the filing (e.g., "2024-12-31")
    positions: SecPosition[]; // Array of positions in the filing
}

/**
 * Interface for backtest metadata stored in S3
 */
export interface BacktestMetadata {
    ticker: string;
    from_date: string;
    to_date: string;
    short_atr_period: number;
    long_atr_period: number;
    alpha: number;
    group_tag: string;
    timestamp: string;
    weightingAtr: number;
}
