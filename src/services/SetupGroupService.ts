// src/services/SetupGroupService.ts
import { MergedData } from "../types";

/**
 * Enum for setup group types
 */
export enum SetupGroupType {
  // Entry Strategy & Proximity
  BUY_STOP = "Buy Stop Setups",
  BUY_LIMIT = "Buy Limit Setups",

  // Risk/Reward Ratio
  LOW_RISK_REWARD = "Low Risk/Reward Setups",
  BALANCED_RISK_REWARD = "Balanced Risk/Reward Setups",
  HIGH_RISK_REWARD = "High Risk/Reward Setups",

  // Absolute Risk (Fixed Stop Distance)
  TIGHT_STOP = "Tight Stop Setups",
  MEDIUM_STOP = "Medium Stop Setups",
  WIDE_STOP = "Wide Stop Setups",

  // Potential Profit Magnitude (Fixed Limit Distance)
  SMALL_TARGET = "Small Target Setups",
  MEDIUM_TARGET = "Medium Target Setups",
  LARGE_TARGET = "Large Target Setups",

  // Fixed Time Limit
  SHORT_DURATION = "Short Duration Setups",
  MEDIUM_DURATION = "Medium Duration Setups",
  LONG_DURATION = "Long Duration Setups",

  // Combined Characteristic Groups
  BREAKOUT_HIGH_RR = "Breakout - High R:R",
  BREAKOUT_BALANCED_RR = "Breakout - Balanced R:R",
  LIMIT_ENTRY_HIGH_RR = "Limit Entry - High R:R",
  LIMIT_ENTRY_BALANCED_RR = "Limit Entry - Balanced R:R",
  TIGHT_STOP_HIGH_RR = "Tight Stop - High R:R",
  WIDE_STOP_BALANCED_RR = "Wide Stop - Balanced R:R",

  // Trade Styles
  SCALPING_STYLE = "Scalping-Style Setups",
  DAY_TRADING_STYLE = "Day-Trading Setups",
  SWING_TRADING_STYLE = "Swing-Trading Setups"
}

/**
 * Interface for a setup group
 */
export interface SetupGroup {
  type: SetupGroupType;
  name: string;
  description: string;
  setups: MergedData[];
}

/**
 * Configuration for grouping thresholds
 */
export interface GroupingConfig {
  // Risk/Reward Ratio thresholds
  lowRiskRewardThreshold: number;
  highRiskRewardThreshold: number;

  // Stop distance thresholds
  tightStopThreshold: number;
  wideStopThreshold: number;

  // Limit distance thresholds
  smallTargetThreshold: number;
  largeTargetThreshold: number;

  // Trade duration thresholds (in minutes)
  shortDurationThreshold: number;
  longDurationThreshold: number;
}

// Default configuration
const defaultConfig: GroupingConfig = {
  lowRiskRewardThreshold: 1,
  highRiskRewardThreshold: 2,

  tightStopThreshold: 20,
  wideStopThreshold: 50,

  smallTargetThreshold: 30,
  largeTargetThreshold: 100,

  shortDurationThreshold: 240, // 4 hours
  longDurationThreshold: 1440, // 24 hours
};

/**
 * Determines if a setup is a buy stop setup
 * A positive tick offset means the market has to go up to open the position
 */
const isBuyStop = (setup: MergedData): boolean => {
  return setup.tickoffset > 0;
};

/**
 * Determines if a setup is a buy limit setup
 * A negative tick offset means the market needs to come down to open the position
 */
const isBuyLimit = (setup: MergedData): boolean => {
  return setup.tickoffset < 0;
};

/**
 * Groups setups by entry strategy
 */
const groupByEntryStrategy = (setups: MergedData[]): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.BUY_STOP]: [],
    [SetupGroupType.BUY_LIMIT]: [],
  };

  setups.forEach(setup => {
    if (isBuyStop(setup)) {
      groups[SetupGroupType.BUY_STOP]!.push(setup);
    }
    if (isBuyLimit(setup)) {
      groups[SetupGroupType.BUY_LIMIT]!.push(setup);
    }
  });

  return groups;
};

/**
 * Groups setups by risk/reward ratio
 */
const groupByRiskReward = (
  setups: MergedData[], 
  config: GroupingConfig = defaultConfig
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.LOW_RISK_REWARD]: [],
    [SetupGroupType.BALANCED_RISK_REWARD]: [],
    [SetupGroupType.HIGH_RISK_REWARD]: [],
  };

  setups.forEach(setup => {
    if (setup.reward_risk_ratio < config.lowRiskRewardThreshold) {
      groups[SetupGroupType.LOW_RISK_REWARD]!.push(setup);
    } else if (setup.reward_risk_ratio >= config.highRiskRewardThreshold) {
      groups[SetupGroupType.HIGH_RISK_REWARD]!.push(setup);
    } else {
      groups[SetupGroupType.BALANCED_RISK_REWARD]!.push(setup);
    }
  });

  return groups;
};

/**
 * Groups setups by stop distance
 */
const groupByStopDistance = (
  setups: MergedData[], 
  config: GroupingConfig = defaultConfig
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.TIGHT_STOP]: [],
    [SetupGroupType.MEDIUM_STOP]: [],
    [SetupGroupType.WIDE_STOP]: [],
  };

  setups.forEach(setup => {
    const stopDistance = Math.abs(setup.stop);
    if (stopDistance < config.tightStopThreshold) {
      groups[SetupGroupType.TIGHT_STOP]!.push(setup);
    } else if (stopDistance >= config.wideStopThreshold) {
      groups[SetupGroupType.WIDE_STOP]!.push(setup);
    } else {
      groups[SetupGroupType.MEDIUM_STOP]!.push(setup);
    }
  });

  return groups;
};

/**
 * Groups setups by limit distance (target size)
 */
const groupByLimitDistance = (
  setups: MergedData[], 
  config: GroupingConfig = defaultConfig
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.SMALL_TARGET]: [],
    [SetupGroupType.MEDIUM_TARGET]: [],
    [SetupGroupType.LARGE_TARGET]: [],
  };

  setups.forEach(setup => {
    const limitDistance = Math.abs(setup.limit);
    if (limitDistance < config.smallTargetThreshold) {
      groups[SetupGroupType.SMALL_TARGET]!.push(setup);
    } else if (limitDistance >= config.largeTargetThreshold) {
      groups[SetupGroupType.LARGE_TARGET]!.push(setup);
    } else {
      groups[SetupGroupType.MEDIUM_TARGET]!.push(setup);
    }
  });

  return groups;
};

/**
 * Groups setups by trade duration
 */
const groupByTradeDuration = (
  setups: MergedData[], 
  config: GroupingConfig = defaultConfig
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.SHORT_DURATION]: [],
    [SetupGroupType.MEDIUM_DURATION]: [],
    [SetupGroupType.LONG_DURATION]: [],
  };

  setups.forEach(setup => {
    if (setup.tradeduration < config.shortDurationThreshold) {
      groups[SetupGroupType.SHORT_DURATION]!.push(setup);
    } else if (setup.tradeduration >= config.longDurationThreshold) {
      groups[SetupGroupType.LONG_DURATION]!.push(setup);
    } else {
      groups[SetupGroupType.MEDIUM_DURATION]!.push(setup);
    }
  });

  return groups;
};

/**
 * Groups setups by combined characteristics
 */
const groupByCombinedCharacteristics = (
  setups: MergedData[], 
  config: GroupingConfig = defaultConfig
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.BREAKOUT_HIGH_RR]: [],
    [SetupGroupType.BREAKOUT_BALANCED_RR]: [],
    [SetupGroupType.LIMIT_ENTRY_HIGH_RR]: [],
    [SetupGroupType.LIMIT_ENTRY_BALANCED_RR]: [],
    [SetupGroupType.TIGHT_STOP_HIGH_RR]: [],
    [SetupGroupType.WIDE_STOP_BALANCED_RR]: [],
    [SetupGroupType.SCALPING_STYLE]: [],
    [SetupGroupType.DAY_TRADING_STYLE]: [],
    [SetupGroupType.SWING_TRADING_STYLE]: [],
  };

  setups.forEach(setup => {
    const isBreakout = isBuyStop(setup);
    const isLimitEntry = isBuyLimit(setup);
    const isHighRR = setup.reward_risk_ratio >= config.highRiskRewardThreshold;
    const isBalancedRR = setup.reward_risk_ratio >= config.lowRiskRewardThreshold && 
                         setup.reward_risk_ratio < config.highRiskRewardThreshold;
    const isTightStop = Math.abs(setup.stop) < config.tightStopThreshold;
    const isWideStop = Math.abs(setup.stop) >= config.wideStopThreshold;
    const isSmallTarget = Math.abs(setup.limit) < config.smallTargetThreshold;
    const isShortDuration = setup.tradeduration < config.shortDurationThreshold;
    const isLongDuration = setup.tradeduration >= config.longDurationThreshold;

    // Combined groups
    if (isBreakout && isHighRR) {
      groups[SetupGroupType.BREAKOUT_HIGH_RR]!.push(setup);
    }
    if (isBreakout && isBalancedRR) {
      groups[SetupGroupType.BREAKOUT_BALANCED_RR]!.push(setup);
    }
    if (isLimitEntry && isHighRR) {
      groups[SetupGroupType.LIMIT_ENTRY_HIGH_RR]!.push(setup);
    }
    if (isLimitEntry && isBalancedRR) {
      groups[SetupGroupType.LIMIT_ENTRY_BALANCED_RR]!.push(setup);
    }
    if (isTightStop && isHighRR) {
      groups[SetupGroupType.TIGHT_STOP_HIGH_RR]!.push(setup);
    }
    if (isWideStop && isBalancedRR) {
      groups[SetupGroupType.WIDE_STOP_BALANCED_RR]!.push(setup);
    }

    // Trade style groups
    if (isTightStop && isSmallTarget && isShortDuration) {
      groups[SetupGroupType.SCALPING_STYLE]!.push(setup);
    }
    if (isShortDuration && !isLongDuration) {
      groups[SetupGroupType.DAY_TRADING_STYLE]!.push(setup);
    }
    if (isLongDuration) {
      groups[SetupGroupType.SWING_TRADING_STYLE]!.push(setup);
    }
  });

  return groups;
};

/**
 * Groups setups by all criteria
 */
export const groupSetups = (
  setups: MergedData[], 
  config: GroupingConfig = defaultConfig
): Partial<Record<SetupGroupType, MergedData[]>> => {
  return {
    ...groupByEntryStrategy(setups),
    ...groupByRiskReward(setups, config),
    ...groupByStopDistance(setups, config),
    ...groupByLimitDistance(setups, config),
    ...groupByTradeDuration(setups, config),
    ...groupByCombinedCharacteristics(setups, config),
  };
};

/**
 * Gets all setup groups with their descriptions
 */
export const getSetupGroupDescriptions = (): { type: SetupGroupType; name: string; description: string }[] => {
  return [
    {
      type: SetupGroupType.BUY_STOP,
      name: "Buy Stop Setups",
      description: "Positive tick offset. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT,
      name: "Buy Limit Setups",
      description: "Negative tick offset. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.LOW_RISK_REWARD,
      name: "Low Risk/Reward Setups",
      description: "R:R < 1 (e.g., risking 50 pips to make 30 pips). These often require a very high win rate."
    },
    {
      type: SetupGroupType.BALANCED_RISK_REWARD,
      name: "Balanced Risk/Reward Setups",
      description: "R:R between 1 and 2 (e.g., 1:1, 1.5:1)."
    },
    {
      type: SetupGroupType.HIGH_RISK_REWARD,
      name: "High Risk/Reward Setups",
      description: "R:R ≥ 2 (e.g., risking 50 pips to make 100 pips or more). These can be profitable with lower win rates."
    },
    {
      type: SetupGroupType.TIGHT_STOP,
      name: "Tight Stop Setups",
      description: "Stop-loss is a small fixed amount."
    },
    {
      type: SetupGroupType.MEDIUM_STOP,
      name: "Medium Stop Setups",
      description: "Stop-loss is a moderate fixed amount."
    },
    {
      type: SetupGroupType.WIDE_STOP,
      name: "Wide Stop Setups",
      description: "Stop-loss is a large fixed amount."
    },
    {
      type: SetupGroupType.SMALL_TARGET,
      name: "Small Target Setups",
      description: "Take-profit is a small fixed amount. Often associated with scalping or very short-term trades."
    },
    {
      type: SetupGroupType.MEDIUM_TARGET,
      name: "Medium Target Setups",
      description: "Take-profit is a moderate fixed amount."
    },
    {
      type: SetupGroupType.LARGE_TARGET,
      name: "Large Target Setups",
      description: "Take-profit is a large fixed amount."
    },
    {
      type: SetupGroupType.SHORT_DURATION,
      name: "Short Duration Setups",
      description: "Time limit < 4 hours (intraday focus)."
    },
    {
      type: SetupGroupType.MEDIUM_DURATION,
      name: "Medium Duration Setups",
      description: "Time limit between 4 hours and 24 hours."
    },
    {
      type: SetupGroupType.LONG_DURATION,
      name: "Long Duration Setups",
      description: "Time limit > 24 hours."
    },
    {
      type: SetupGroupType.BREAKOUT_HIGH_RR,
      name: "Breakout - High R:R",
      description: "Breakout entry with high risk/reward ratio."
    },
    {
      type: SetupGroupType.BREAKOUT_BALANCED_RR,
      name: "Breakout - Balanced R:R",
      description: "Breakout entry with balanced risk/reward ratio."
    },
    {
      type: SetupGroupType.LIMIT_ENTRY_HIGH_RR,
      name: "Limit Entry - High R:R",
      description: "Limit entry with high risk/reward ratio."
    },
    {
      type: SetupGroupType.LIMIT_ENTRY_BALANCED_RR,
      name: "Limit Entry - Balanced R:R",
      description: "Limit entry with balanced risk/reward ratio."
    },
    {
      type: SetupGroupType.TIGHT_STOP_HIGH_RR,
      name: "Tight Stop - High R:R",
      description: "Tight stop with high risk/reward ratio."
    },
    {
      type: SetupGroupType.WIDE_STOP_BALANCED_RR,
      name: "Wide Stop - Balanced R:R",
      description: "Wide stop with balanced risk/reward ratio."
    },
    {
      type: SetupGroupType.SCALPING_STYLE,
      name: "Scalping-Style Setups",
      description: "Very tight stops, very small targets, very short time limits."
    },
    {
      type: SetupGroupType.DAY_TRADING_STYLE,
      name: "Day-Trading Setups",
      description: "Moderate stops and targets, time limits within the day."
    },
    {
      type: SetupGroupType.SWING_TRADING_STYLE,
      name: "Swing-Trading Setups",
      description: "Wider stops and targets, time limits spanning several days."
    }
  ];
};

export default {
  groupSetups,
  getSetupGroupDescriptions,
  SetupGroupType
};
