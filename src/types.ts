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
    tickoffset: number;
    tradeduration: number;
    outoftime: number;
}
