// src/services/SetupGroupService.ts
import { MergedData } from "../types";

/**
 * Enum for setup group types
 */
export enum SetupGroupType {
  // Top Level Groups
  BUY_STOP = "Buy Stop Setups",
  BUY_LIMIT = "Buy Limit Setups",

  // General Groups
  GENERAL_BUY_STOP_SETUPS = "General Buy Stop Setups",
  GENERAL_BUY_LIMIT_SETUPS = "General Buy Limit Setups",

  // Risk/Reward Ratio
  BUY_STOP_LOW_RISK_REWARD = "Buy Stop - Low Risk/Reward Setups",
  BUY_LIMIT_LOW_RISK_REWARD = "Buy Limit - Low Risk/Reward Setups",

  BUY_STOP_BALANCED_RISK_REWARD = "Buy Stop - Balanced Risk/Reward Setups",
  BUY_LIMIT_BALANCED_RISK_REWARD = "Buy Limit - Balanced Risk/Reward Setups",

  BUY_STOP_HIGH_RISK_REWARD = "Buy Stop - High Risk/Reward Setups",
  BUY_LIMIT_HIGH_RISK_REWARD = "Buy Limit - High Risk/Reward Setups",

  // Absolute Risk (Fixed Stop Distance)
  BUY_STOP_TIGHT_STOP = "Buy Stop - Tight Stop Setups",
  BUY_LIMIT_TIGHT_STOP = "Buy Limit - Tight Stop Setups",

  BUY_STOP_MEDIUM_STOP = "Buy Stop - Medium Stop Setups",
  BUY_LIMIT_MEDIUM_STOP = "Buy Limit - Medium Stop Setups",

  BUY_STOP_WIDE_STOP = "Buy Stop - Wide Stop Setups",
  BUY_LIMIT_WIDE_STOP = "Buy Limit - Wide Stop Setups",

  // Tick Offset Size
  BUY_STOP_SMALL_TICKOFFSET = "Buy Stop - Small Tick Offset Setups",
  BUY_LIMIT_SMALL_TICKOFFSET = "Buy Limit - Small Tick Offset Setups",

  BUY_STOP_MEDIUM_TICKOFFSET = "Buy Stop - Medium Tick Offset Setups",
  BUY_LIMIT_MEDIUM_TICKOFFSET = "Buy Limit - Medium Tick Offset Setups",

  BUY_STOP_LARGE_TICKOFFSET = "Buy Stop - Large Tick Offset Setups",
  BUY_LIMIT_LARGE_TICKOFFSET = "Buy Limit - Large Tick Offset Setups",

  // Combined Tick Offset and Stop
  BUY_STOP_LARGE_TICKOFFSET_TIGHT_STOP = "Buy Stop - Large Tick Offset - Tight Stop Setups",
  BUY_LIMIT_LARGE_TICKOFFSET_TIGHT_STOP = "Buy Limit - Large Tick Offset - Tight Stop Setups",

  // Potential Profit Magnitude (Fixed Limit Distance)
  BUY_STOP_SMALL_TARGET = "Buy Stop - Small Target Setups",
  BUY_LIMIT_SMALL_TARGET = "Buy Limit - Small Target Setups",

  BUY_STOP_MEDIUM_TARGET = "Buy Stop - Medium Target Setups",
  BUY_LIMIT_MEDIUM_TARGET = "Buy Limit - Medium Target Setups",

  BUY_STOP_LARGE_TARGET = "Buy Stop - Large Target Setups",
  BUY_LIMIT_LARGE_TARGET = "Buy Limit - Large Target Setups",

  // Fixed Time Limit
  BUY_STOP_SHORT_DURATION = "Buy Stop - Short Duration Setups",
  BUY_LIMIT_SHORT_DURATION = "Buy Limit - Short Duration Setups",

  BUY_STOP_MEDIUM_DURATION = "Buy Stop - Medium Duration Setups",
  BUY_LIMIT_MEDIUM_DURATION = "Buy Limit - Medium Duration Setups",

  BUY_STOP_LONG_DURATION = "Buy Stop - Long Duration Setups",
  BUY_LIMIT_LONG_DURATION = "Buy Limit - Long Duration Setups",

  // Combined Characteristic Groups
  BREAKOUT_HIGH_RR = "Breakout - High R:R",
  BREAKOUT_BALANCED_RR = "Breakout - Balanced R:R",
  LIMIT_ENTRY_HIGH_RR = "Limit Entry - High R:R",
  LIMIT_ENTRY_BALANCED_RR = "Limit Entry - Balanced R:R",

  BUY_STOP_TIGHT_STOP_HIGH_RR = "Buy Stop - Tight Stop - High R:R",
  BUY_LIMIT_TIGHT_STOP_HIGH_RR = "Buy Limit - Tight Stop - High R:R",

  BUY_STOP_WIDE_STOP_BALANCED_RR = "Buy Stop - Wide Stop - Balanced R:R",
  BUY_LIMIT_WIDE_STOP_BALANCED_RR = "Buy Limit - Wide Stop - Balanced R:R",

  // Trade Styles
  BUY_STOP_SCALPING_STYLE = "Buy Stop - Scalping-Style Setups",
  BUY_LIMIT_SCALPING_STYLE = "Buy Limit - Scalping-Style Setups",

  BUY_STOP_DAY_TRADING_STYLE = "Buy Stop - Day-Trading Setups",
  BUY_LIMIT_DAY_TRADING_STYLE = "Buy Limit - Day-Trading Setups",

  BUY_STOP_SWING_TRADING_STYLE = "Buy Stop - Swing-Trading Setups",
  BUY_LIMIT_SWING_TRADING_STYLE = "Buy Limit - Swing-Trading Setups"
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
 * Interface for a hierarchical setup group
 */
export interface HierarchicalSetupGroup extends SetupGroup {
  children: HierarchicalSetupGroup[];
  parent?: SetupGroupType;
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
    [SetupGroupType.BUY_STOP_LOW_RISK_REWARD]: [],
    [SetupGroupType.BUY_LIMIT_LOW_RISK_REWARD]: [],

    [SetupGroupType.BUY_STOP_BALANCED_RISK_REWARD]: [],
    [SetupGroupType.BUY_LIMIT_BALANCED_RISK_REWARD]: [],

    [SetupGroupType.BUY_STOP_HIGH_RISK_REWARD]: [],
    [SetupGroupType.BUY_LIMIT_HIGH_RISK_REWARD]: [],
  };

  setups.forEach(setup => {
    if (setup.reward_risk_ratio < config.lowRiskRewardThreshold) {
      // Split low risk/reward setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_LOW_RISK_REWARD]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_LOW_RISK_REWARD]!.push(setup);
      }
    } else if (setup.reward_risk_ratio >= config.highRiskRewardThreshold) {
      // Split high risk/reward setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_HIGH_RISK_REWARD]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_HIGH_RISK_REWARD]!.push(setup);
      }
    } else {
      // Split balanced risk/reward setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_BALANCED_RISK_REWARD]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_BALANCED_RISK_REWARD]!.push(setup);
      }
    }
  });

  return groups;
};

/**
 * Groups setups by stop distance
 * Uses dynamic thresholds based on the actual data:
 * - Bottom 25% of setups are classified as tight stop
 * - Top 25% of setups are classified as wide stop
 * - Middle 50% of setups are classified as medium stop
 */
const groupByStopDistance = (
  setups: MergedData[]
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.BUY_STOP_TIGHT_STOP]: [],
    [SetupGroupType.BUY_LIMIT_TIGHT_STOP]: [],

    [SetupGroupType.BUY_STOP_MEDIUM_STOP]: [],
    [SetupGroupType.BUY_LIMIT_MEDIUM_STOP]: [],

    [SetupGroupType.BUY_STOP_WIDE_STOP]: [],
    [SetupGroupType.BUY_LIMIT_WIDE_STOP]: [],
  };

  // If no setups, return empty groups
  if (setups.length === 0) {
    return groups;
  }

  // Extract stop distances and sort them
  const stopDistances = setups.map(setup => Math.abs(setup.stop)).sort((a, b) => a - b);

  // Calculate the 25th and 75th percentile thresholds
  const tightStopThreshold = stopDistances[Math.floor(stopDistances.length * 0.25)];
  const wideStopThreshold = stopDistances[Math.floor(stopDistances.length * 0.75)];

  // Use these dynamic thresholds to classify setups
  setups.forEach(setup => {
    const stopDistance = Math.abs(setup.stop);
    if (stopDistance <= tightStopThreshold) {
      // Split tight stop setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_TIGHT_STOP]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_TIGHT_STOP]!.push(setup);
      }
    } else if (stopDistance >= wideStopThreshold) {
      // Split wide stop setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_WIDE_STOP]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_WIDE_STOP]!.push(setup);
      }
    } else {
      // Split medium stop setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_MEDIUM_STOP]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_MEDIUM_STOP]!.push(setup);
      }
    }
  });

  return groups;
};

/**
 * Groups setups by tick offset size
 * Uses dynamic thresholds based on the actual data:
 * - Bottom 25% of setups are classified as small tick offset
 * - Top 25% of setups are classified as large tick offset
 * - Middle 50% of setups are classified as medium tick offset
 * - Also identifies setups with large tick offset and tight stop
 */
const groupByTickOffset = (
  setups: MergedData[]
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.BUY_STOP_SMALL_TICKOFFSET]: [],
    [SetupGroupType.BUY_LIMIT_SMALL_TICKOFFSET]: [],

    [SetupGroupType.BUY_STOP_MEDIUM_TICKOFFSET]: [],
    [SetupGroupType.BUY_LIMIT_MEDIUM_TICKOFFSET]: [],

    [SetupGroupType.BUY_STOP_LARGE_TICKOFFSET]: [],
    [SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET]: [],

    [SetupGroupType.BUY_STOP_LARGE_TICKOFFSET_TIGHT_STOP]: [],
    [SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET_TIGHT_STOP]: [],
  };

  // If no setups, return empty groups
  if (setups.length === 0) {
    return groups;
  }

  // Extract tick offsets and sort them (separately for buy stop and buy limit)
  const buyStopTickOffsets = setups
    .filter(setup => setup.tickoffset > 0)
    .map(setup => setup.tickoffset)
    .sort((a, b) => a - b);

  const buyLimitTickOffsets = setups
    .filter(setup => setup.tickoffset < 0)
    .map(setup => Math.abs(setup.tickoffset))
    .sort((a, b) => a - b);

  // Calculate the 25th and 75th percentile thresholds for buy stop
  let smallBuyStopThreshold = 0;
  let largeBuyStopThreshold = 0;
  if (buyStopTickOffsets.length > 0) {
    smallBuyStopThreshold = buyStopTickOffsets[Math.floor(buyStopTickOffsets.length * 0.25)];
    largeBuyStopThreshold = buyStopTickOffsets[Math.floor(buyStopTickOffsets.length * 0.75)];
  }

  // Calculate the 25th and 75th percentile thresholds for buy limit
  let smallBuyLimitThreshold = 0;
  let largeBuyLimitThreshold = 0;
  if (buyLimitTickOffsets.length > 0) {
    smallBuyLimitThreshold = buyLimitTickOffsets[Math.floor(buyLimitTickOffsets.length * 0.25)];
    largeBuyLimitThreshold = buyLimitTickOffsets[Math.floor(buyLimitTickOffsets.length * 0.75)];
  }

  // Extract stop distances and sort them for tight stop identification
  const stopDistances = setups.map(setup => Math.abs(setup.stop)).sort((a, b) => a - b);
  let tightStopThreshold = 0;
  if (stopDistances.length > 0) {
    tightStopThreshold = stopDistances[Math.floor(stopDistances.length * 0.25)];
  }

  // Use these dynamic thresholds to classify setups
  setups.forEach(setup => {
    if (setup.tickoffset > 0) {
      // Buy Stop setups
      if (setup.tickoffset <= smallBuyStopThreshold) {
        groups[SetupGroupType.BUY_STOP_SMALL_TICKOFFSET]!.push(setup);
      } else if (setup.tickoffset >= largeBuyStopThreshold) {
        groups[SetupGroupType.BUY_STOP_LARGE_TICKOFFSET]!.push(setup);

        // Check if this is also a tight stop setup
        if (Math.abs(setup.stop) <= tightStopThreshold) {
          groups[SetupGroupType.BUY_STOP_LARGE_TICKOFFSET_TIGHT_STOP]!.push(setup);
        }
      } else {
        groups[SetupGroupType.BUY_STOP_MEDIUM_TICKOFFSET]!.push(setup);
      }
    } else if (setup.tickoffset < 0) {
      // Buy Limit setups
      const absTickOffset = Math.abs(setup.tickoffset);
      if (absTickOffset <= smallBuyLimitThreshold) {
        groups[SetupGroupType.BUY_LIMIT_SMALL_TICKOFFSET]!.push(setup);
      } else if (absTickOffset >= largeBuyLimitThreshold) {
        groups[SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET]!.push(setup);

        // Check if this is also a tight stop setup
        if (Math.abs(setup.stop) <= tightStopThreshold) {
          groups[SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET_TIGHT_STOP]!.push(setup);
        }
      } else {
        groups[SetupGroupType.BUY_LIMIT_MEDIUM_TICKOFFSET]!.push(setup);
      }
    }
  });

  return groups;
};

/**
 * Groups setups by limit distance (target size)
 * Uses dynamic thresholds based on the actual data:
 * - Bottom 25% of setups are classified as small target
 * - Top 25% of setups are classified as large target
 * - Middle 50% of setups are classified as medium target
 */
const groupByLimitDistance = (
  setups: MergedData[]
): Partial<Record<SetupGroupType, MergedData[]>> => {
  const groups: Partial<Record<SetupGroupType, MergedData[]>> = {
    [SetupGroupType.BUY_STOP_SMALL_TARGET]: [],
    [SetupGroupType.BUY_LIMIT_SMALL_TARGET]: [],

    [SetupGroupType.BUY_STOP_MEDIUM_TARGET]: [],
    [SetupGroupType.BUY_LIMIT_MEDIUM_TARGET]: [],

    [SetupGroupType.BUY_STOP_LARGE_TARGET]: [],
    [SetupGroupType.BUY_LIMIT_LARGE_TARGET]: [],
  };

  // If no setups, return empty groups
  if (setups.length === 0) {
    return groups;
  }

  // Extract limit distances and sort them
  const limitDistances = setups.map(setup => Math.abs(setup.limit)).sort((a, b) => a - b);

  // Calculate the 25th and 75th percentile thresholds
  const smallTargetThreshold = limitDistances[Math.floor(limitDistances.length * 0.25)];
  const largeTargetThreshold = limitDistances[Math.floor(limitDistances.length * 0.75)];

  // Use these dynamic thresholds to classify setups
  setups.forEach(setup => {
    const limitDistance = Math.abs(setup.limit);
    if (limitDistance <= smallTargetThreshold) {
      // Split small target setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_SMALL_TARGET]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_SMALL_TARGET]!.push(setup);
      }
    } else if (limitDistance >= largeTargetThreshold) {
      // Split large target setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_LARGE_TARGET]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_LARGE_TARGET]!.push(setup);
      }
    } else {
      // Split medium target setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_MEDIUM_TARGET]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_MEDIUM_TARGET]!.push(setup);
      }
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
    [SetupGroupType.BUY_STOP_SHORT_DURATION]: [],
    [SetupGroupType.BUY_LIMIT_SHORT_DURATION]: [],

    [SetupGroupType.BUY_STOP_MEDIUM_DURATION]: [],
    [SetupGroupType.BUY_LIMIT_MEDIUM_DURATION]: [],

    [SetupGroupType.BUY_STOP_LONG_DURATION]: [],
    [SetupGroupType.BUY_LIMIT_LONG_DURATION]: [],
  };

  setups.forEach(setup => {
    if (setup.tradeduration < config.shortDurationThreshold) {
      // Split short duration setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_SHORT_DURATION]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_SHORT_DURATION]!.push(setup);
      }
    } else if (setup.tradeduration >= config.longDurationThreshold) {
      // Split long duration setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_LONG_DURATION]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_LONG_DURATION]!.push(setup);
      }
    } else {
      // Split medium duration setups based on tick offset
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_MEDIUM_DURATION]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_MEDIUM_DURATION]!.push(setup);
      }
    }
  });

  return groups;
};

/**
 * Groups setups by combined characteristics
 * Uses dynamic thresholds for stop distance and limit distance
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

    [SetupGroupType.BUY_STOP_TIGHT_STOP_HIGH_RR]: [],
    [SetupGroupType.BUY_LIMIT_TIGHT_STOP_HIGH_RR]: [],

    [SetupGroupType.BUY_STOP_WIDE_STOP_BALANCED_RR]: [],
    [SetupGroupType.BUY_LIMIT_WIDE_STOP_BALANCED_RR]: [],

    [SetupGroupType.BUY_STOP_SCALPING_STYLE]: [],
    [SetupGroupType.BUY_LIMIT_SCALPING_STYLE]: [],

    [SetupGroupType.BUY_STOP_DAY_TRADING_STYLE]: [],
    [SetupGroupType.BUY_LIMIT_DAY_TRADING_STYLE]: [],

    [SetupGroupType.BUY_STOP_SWING_TRADING_STYLE]: [],
    [SetupGroupType.BUY_LIMIT_SWING_TRADING_STYLE]: [],
  };

  // If no setups, return empty groups
  if (setups.length === 0) {
    return groups;
  }

  // Extract stop distances and sort them for percentile calculation
  const stopDistances = setups.map(setup => Math.abs(setup.stop)).sort((a, b) => a - b);
  const tightStopThreshold = stopDistances[Math.floor(stopDistances.length * 0.25)];
  const wideStopThreshold = stopDistances[Math.floor(stopDistances.length * 0.75)];

  // Extract limit distances and sort them for percentile calculation
  const limitDistances = setups.map(setup => Math.abs(setup.limit)).sort((a, b) => a - b);
  const smallTargetThreshold = limitDistances[Math.floor(limitDistances.length * 0.25)];

  setups.forEach(setup => {
    const isBreakout = isBuyStop(setup);
    const isLimitEntry = isBuyLimit(setup);
    const isHighRR = setup.reward_risk_ratio >= config.highRiskRewardThreshold;
    const isBalancedRR = setup.reward_risk_ratio >= config.lowRiskRewardThreshold && 
                         setup.reward_risk_ratio < config.highRiskRewardThreshold;
    const isTightStop = Math.abs(setup.stop) <= tightStopThreshold;
    const isWideStop = Math.abs(setup.stop) >= wideStopThreshold;
    const isSmallTarget = Math.abs(setup.limit) <= smallTargetThreshold;
    const isShortDuration = setup.tradeduration < config.shortDurationThreshold;
    const isLongDuration = setup.tradeduration >= config.longDurationThreshold;

    // Combined groups - these are already split by entry type
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

    // Split tight stop high RR setups based on tick offset
    if (isTightStop && isHighRR) {
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_TIGHT_STOP_HIGH_RR]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_TIGHT_STOP_HIGH_RR]!.push(setup);
      }
    }

    // Split wide stop balanced RR setups based on tick offset
    if (isWideStop && isBalancedRR) {
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_WIDE_STOP_BALANCED_RR]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_WIDE_STOP_BALANCED_RR]!.push(setup);
      }
    }

    // Split trade style groups based on tick offset
    if (isTightStop && isSmallTarget && isShortDuration) {
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_SCALPING_STYLE]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_SCALPING_STYLE]!.push(setup);
      }
    }

    if (isShortDuration && !isLongDuration) {
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_DAY_TRADING_STYLE]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_DAY_TRADING_STYLE]!.push(setup);
      }
    }

    if (isLongDuration) {
      if (setup.tickoffset > 0) {
        groups[SetupGroupType.BUY_STOP_SWING_TRADING_STYLE]!.push(setup);
      } else if (setup.tickoffset < 0) {
        groups[SetupGroupType.BUY_LIMIT_SWING_TRADING_STYLE]!.push(setup);
      }
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
    ...groupByStopDistance(setups),
    ...groupByTickOffset(setups),
    ...groupByLimitDistance(setups),
    ...groupByTradeDuration(setups, config),
    ...groupByCombinedCharacteristics(setups, config),
  };
};

/**
 * Defines which setup groups belong to which parent group
 */
export const setupGroupHierarchy: Record<SetupGroupType, SetupGroupType | null> = {
  // Top level groups have no parent
  [SetupGroupType.BUY_STOP]: null,
  [SetupGroupType.BUY_LIMIT]: null,

  // General groups
  [SetupGroupType.GENERAL_BUY_STOP_SETUPS]: SetupGroupType.BUY_STOP,
  [SetupGroupType.GENERAL_BUY_LIMIT_SETUPS]: SetupGroupType.BUY_LIMIT,

  // Risk/Reward groups - explicitly assigned to their respective parent groups
  [SetupGroupType.BUY_STOP_LOW_RISK_REWARD]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_LOW_RISK_REWARD]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_BALANCED_RISK_REWARD]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_BALANCED_RISK_REWARD]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_HIGH_RISK_REWARD]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_HIGH_RISK_REWARD]: SetupGroupType.BUY_LIMIT,

  // Stop Distance groups
  [SetupGroupType.BUY_STOP_TIGHT_STOP]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_TIGHT_STOP]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_MEDIUM_STOP]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_MEDIUM_STOP]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_WIDE_STOP]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_WIDE_STOP]: SetupGroupType.BUY_LIMIT,

  // Tick Offset Size groups
  [SetupGroupType.BUY_STOP_SMALL_TICKOFFSET]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_SMALL_TICKOFFSET]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_MEDIUM_TICKOFFSET]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_MEDIUM_TICKOFFSET]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_LARGE_TICKOFFSET]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_LARGE_TICKOFFSET_TIGHT_STOP]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET_TIGHT_STOP]: SetupGroupType.BUY_LIMIT,

  // Target Size groups
  [SetupGroupType.BUY_STOP_SMALL_TARGET]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_SMALL_TARGET]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_MEDIUM_TARGET]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_MEDIUM_TARGET]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_LARGE_TARGET]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_LARGE_TARGET]: SetupGroupType.BUY_LIMIT,

  // Duration groups
  [SetupGroupType.BUY_STOP_SHORT_DURATION]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_SHORT_DURATION]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_MEDIUM_DURATION]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_MEDIUM_DURATION]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_LONG_DURATION]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_LONG_DURATION]: SetupGroupType.BUY_LIMIT,

  // Combined characteristic groups - already have natural parents
  [SetupGroupType.BREAKOUT_HIGH_RR]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BREAKOUT_BALANCED_RR]: SetupGroupType.BUY_STOP,
  [SetupGroupType.LIMIT_ENTRY_HIGH_RR]: SetupGroupType.BUY_LIMIT,
  [SetupGroupType.LIMIT_ENTRY_BALANCED_RR]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_TIGHT_STOP_HIGH_RR]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_TIGHT_STOP_HIGH_RR]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_WIDE_STOP_BALANCED_RR]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_WIDE_STOP_BALANCED_RR]: SetupGroupType.BUY_LIMIT,

  // Trade style groups
  [SetupGroupType.BUY_STOP_SCALPING_STYLE]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_SCALPING_STYLE]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_DAY_TRADING_STYLE]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_DAY_TRADING_STYLE]: SetupGroupType.BUY_LIMIT,

  [SetupGroupType.BUY_STOP_SWING_TRADING_STYLE]: SetupGroupType.BUY_STOP,
  [SetupGroupType.BUY_LIMIT_SWING_TRADING_STYLE]: SetupGroupType.BUY_LIMIT,
};

/**
 * Organizes setup groups into a hierarchical structure
 */
export const organizeSetupGroupsHierarchically = (
  groupedSetups: Partial<Record<SetupGroupType, MergedData[]>>
): Partial<Record<SetupGroupType, HierarchicalSetupGroup>> => {
  const hierarchicalGroups: Partial<Record<SetupGroupType, HierarchicalSetupGroup>> = {};
  const setupGroupDescriptions = getSetupGroupDescriptionsMap();

  // Initialize top-level groups
  hierarchicalGroups[SetupGroupType.BUY_STOP] = {
    type: SetupGroupType.BUY_STOP,
    name: setupGroupDescriptions[SetupGroupType.BUY_STOP].name,
    description: setupGroupDescriptions[SetupGroupType.BUY_STOP].description,
    setups: [], // No setups directly in top-level group
    children: []
  };

  hierarchicalGroups[SetupGroupType.BUY_LIMIT] = {
    type: SetupGroupType.BUY_LIMIT,
    name: setupGroupDescriptions[SetupGroupType.BUY_LIMIT].name,
    description: setupGroupDescriptions[SetupGroupType.BUY_LIMIT].description,
    setups: [], // No setups directly in top-level group
    children: []
  };

  // Create general groups
  const generalBuyStopGroup: HierarchicalSetupGroup = {
    type: SetupGroupType.GENERAL_BUY_STOP_SETUPS,
    name: "General Buy Stop Setups",
    description: "All Buy Stop setups",
    setups: groupedSetups[SetupGroupType.BUY_STOP] || [],
    children: [],
    parent: SetupGroupType.BUY_STOP
  };

  const generalBuyLimitGroup: HierarchicalSetupGroup = {
    type: SetupGroupType.GENERAL_BUY_LIMIT_SETUPS,
    name: "General Buy Limit Setups",
    description: "All Buy Limit setups",
    setups: groupedSetups[SetupGroupType.BUY_LIMIT] || [],
    children: [],
    parent: SetupGroupType.BUY_LIMIT
  };

  // Add general groups to their parent groups
  hierarchicalGroups[SetupGroupType.BUY_STOP]!.children.push(generalBuyStopGroup);
  hierarchicalGroups[SetupGroupType.BUY_LIMIT]!.children.push(generalBuyLimitGroup);

  // Dynamically assign parents for groups that need it
  // For each setup in these groups, check if it's a buy stop or buy limit setup
  const dynamicParentAssignment = (groupType: SetupGroupType) => {
    if (!groupedSetups[groupType] || groupedSetups[groupType]!.length === 0) {
      return null; // No setups in this group
    }

    let buyStopCount = 0;
    let buyLimitCount = 0;

    groupedSetups[groupType]!.forEach(setup => {
      if (isBuyStop(setup)) {
        buyStopCount++;
      } else if (isBuyLimit(setup)) {
        buyLimitCount++;
      }
    });

    // Assign to the parent with the majority of setups
    if (buyStopCount > buyLimitCount) {
      return SetupGroupType.BUY_STOP;
    } else if (buyLimitCount > buyStopCount) {
      return SetupGroupType.BUY_LIMIT;
    } else if (buyStopCount > 0) {
      // If equal and not zero, default to BUY_STOP
      return SetupGroupType.BUY_STOP;
    } else {
      // If no setups match either criteria, don't assign a parent
      return null;
    }
  };

  // No groups need dynamic assignment anymore as all groups are explicitly assigned to their parent groups
  const groupsNeedingDynamicAssignment: SetupGroupType[] = [];

  groupsNeedingDynamicAssignment.forEach(groupType => {
    setupGroupHierarchy[groupType] = dynamicParentAssignment(groupType);
  });

  // Create all child groups and add them to their parents
  Object.entries(groupedSetups).forEach(([groupTypeStr, setups]) => {
    const groupType = groupTypeStr as SetupGroupType;

    // Skip top-level groups as they're already created
    if (groupType === SetupGroupType.BUY_STOP || groupType === SetupGroupType.BUY_LIMIT) {
      return;
    }

    // Skip empty groups
    if (!setups || setups.length === 0) {
      return;
    }

    const parentType = setupGroupHierarchy[groupType];

    // Skip groups with no parent
    if (parentType === null) {
      return;
    }

    // Create the child group
    const childGroup: HierarchicalSetupGroup = {
      type: groupType,
      name: setupGroupDescriptions[groupType].name,
      description: setupGroupDescriptions[groupType].description,
      setups: setups,
      children: [],
      parent: parentType
    };

    // Add to parent
    if (hierarchicalGroups[parentType]) {
      hierarchicalGroups[parentType]!.children.push(childGroup);
    }
  });

  return hierarchicalGroups;
};

/**
 * Gets all setup group descriptions as a map
 */
export const getSetupGroupDescriptionsMap = (): Record<SetupGroupType, { name: string; description: string }> => {
  const descriptions = getSetupGroupDescriptions();
  const descMap: Record<SetupGroupType, { name: string; description: string }> = {} as Record<SetupGroupType, { name: string; description: string }>;

  descriptions.forEach(desc => {
    descMap[desc.type] = {
      name: desc.name,
      description: desc.description
    };
  });

  return descMap;
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
      type: SetupGroupType.GENERAL_BUY_STOP_SETUPS,
      name: "General Buy Stop Setups",
      description: "All Buy Stop setups. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.GENERAL_BUY_LIMIT_SETUPS,
      name: "General Buy Limit Setups",
      description: "All Buy Limit setups. The market needs to come down to open the position."
    },

    // Risk/Reward Ratio groups
    {
      type: SetupGroupType.BUY_STOP_LOW_RISK_REWARD,
      name: "Buy Stop - Low Risk/Reward Setups",
      description: "Positive tick offset with R:R < 1. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_LOW_RISK_REWARD,
      name: "Buy Limit - Low Risk/Reward Setups",
      description: "Negative tick offset with R:R < 1. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_BALANCED_RISK_REWARD,
      name: "Buy Stop - Balanced Risk/Reward Setups",
      description: "Positive tick offset with R:R between 1 and 2. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_BALANCED_RISK_REWARD,
      name: "Buy Limit - Balanced Risk/Reward Setups",
      description: "Negative tick offset with R:R between 1 and 2. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_HIGH_RISK_REWARD,
      name: "Buy Stop - High Risk/Reward Setups",
      description: "Positive tick offset with R:R ≥ 2. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_HIGH_RISK_REWARD,
      name: "Buy Limit - High Risk/Reward Setups",
      description: "Negative tick offset with R:R ≥ 2. The market needs to come down to open the position."
    },

    // Stop Distance groups
    {
      type: SetupGroupType.BUY_STOP_TIGHT_STOP,
      name: "Buy Stop - Tight Stop Setups",
      description: "Positive tick offset with stop-loss in the bottom 25% of all setups. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_TIGHT_STOP,
      name: "Buy Limit - Tight Stop Setups",
      description: "Negative tick offset with stop-loss in the bottom 25% of all setups. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_MEDIUM_STOP,
      name: "Buy Stop - Medium Stop Setups",
      description: "Positive tick offset with stop-loss in the middle 50% of all setups. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_MEDIUM_STOP,
      name: "Buy Limit - Medium Stop Setups",
      description: "Negative tick offset with stop-loss in the middle 50% of all setups. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_WIDE_STOP,
      name: "Buy Stop - Wide Stop Setups",
      description: "Positive tick offset with stop-loss in the top 25% of all setups. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_WIDE_STOP,
      name: "Buy Limit - Wide Stop Setups",
      description: "Negative tick offset with stop-loss in the top 25% of all setups. The market needs to come down to open the position."
    },

    // Tick Offset Size groups
    {
      type: SetupGroupType.BUY_STOP_SMALL_TICKOFFSET,
      name: "Buy Stop - Small Tick Offset Setups",
      description: "Positive tick offset in the bottom 25% of all buy stop setups. Smaller distance to entry price."
    },
    {
      type: SetupGroupType.BUY_LIMIT_SMALL_TICKOFFSET,
      name: "Buy Limit - Small Tick Offset Setups",
      description: "Negative tick offset in the bottom 25% of all buy limit setups. Smaller distance to entry price."
    },
    {
      type: SetupGroupType.BUY_STOP_MEDIUM_TICKOFFSET,
      name: "Buy Stop - Medium Tick Offset Setups",
      description: "Positive tick offset in the middle 50% of all buy stop setups. Medium distance to entry price."
    },
    {
      type: SetupGroupType.BUY_LIMIT_MEDIUM_TICKOFFSET,
      name: "Buy Limit - Medium Tick Offset Setups",
      description: "Negative tick offset in the middle 50% of all buy limit setups. Medium distance to entry price."
    },
    {
      type: SetupGroupType.BUY_STOP_LARGE_TICKOFFSET,
      name: "Buy Stop - Large Tick Offset Setups",
      description: "Positive tick offset in the top 25% of all buy stop setups. Larger distance to entry price."
    },
    {
      type: SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET,
      name: "Buy Limit - Large Tick Offset Setups",
      description: "Negative tick offset in the top 25% of all buy limit setups. Larger distance to entry price."
    },
    {
      type: SetupGroupType.BUY_STOP_LARGE_TICKOFFSET_TIGHT_STOP,
      name: "Buy Stop - Large Tick Offset - Tight Stop Setups",
      description: "Positive tick offset in the top 25% with stop-loss in the bottom 25%. Large entry distance with tight stop."
    },
    {
      type: SetupGroupType.BUY_LIMIT_LARGE_TICKOFFSET_TIGHT_STOP,
      name: "Buy Limit - Large Tick Offset - Tight Stop Setups",
      description: "Negative tick offset in the top 25% with stop-loss in the bottom 25%. Large entry distance with tight stop."
    },

    // Target Size groups
    {
      type: SetupGroupType.BUY_STOP_SMALL_TARGET,
      name: "Buy Stop - Small Target Setups",
      description: "Positive tick offset with take-profit in the bottom 25% of all setups. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_SMALL_TARGET,
      name: "Buy Limit - Small Target Setups",
      description: "Negative tick offset with take-profit in the bottom 25% of all setups. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_MEDIUM_TARGET,
      name: "Buy Stop - Medium Target Setups",
      description: "Positive tick offset with take-profit in the middle 50% of all setups. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_MEDIUM_TARGET,
      name: "Buy Limit - Medium Target Setups",
      description: "Negative tick offset with take-profit in the middle 50% of all setups. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_LARGE_TARGET,
      name: "Buy Stop - Large Target Setups",
      description: "Positive tick offset with take-profit in the top 25% of all setups. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_LARGE_TARGET,
      name: "Buy Limit - Large Target Setups",
      description: "Negative tick offset with take-profit in the top 25% of all setups. The market needs to come down to open the position."
    },

    // Duration groups
    {
      type: SetupGroupType.BUY_STOP_SHORT_DURATION,
      name: "Buy Stop - Short Duration Setups",
      description: "Positive tick offset with time limit < 4 hours. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_SHORT_DURATION,
      name: "Buy Limit - Short Duration Setups",
      description: "Negative tick offset with time limit < 4 hours. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_MEDIUM_DURATION,
      name: "Buy Stop - Medium Duration Setups",
      description: "Positive tick offset with time limit between 4 hours and 24 hours. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_MEDIUM_DURATION,
      name: "Buy Limit - Medium Duration Setups",
      description: "Negative tick offset with time limit between 4 hours and 24 hours. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_LONG_DURATION,
      name: "Buy Stop - Long Duration Setups",
      description: "Positive tick offset with time limit > 24 hours. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_LONG_DURATION,
      name: "Buy Limit - Long Duration Setups",
      description: "Negative tick offset with time limit > 24 hours. The market needs to come down to open the position."
    },

    // Combined characteristic groups
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
      type: SetupGroupType.BUY_STOP_TIGHT_STOP_HIGH_RR,
      name: "Buy Stop - Tight Stop - High R:R",
      description: "Positive tick offset with stop-loss in the bottom 25% and R:R ≥ 2. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_TIGHT_STOP_HIGH_RR,
      name: "Buy Limit - Tight Stop - High R:R",
      description: "Negative tick offset with stop-loss in the bottom 25% and R:R ≥ 2. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_WIDE_STOP_BALANCED_RR,
      name: "Buy Stop - Wide Stop - Balanced R:R",
      description: "Positive tick offset with stop-loss in the top 25% and R:R between 1 and 2. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_WIDE_STOP_BALANCED_RR,
      name: "Buy Limit - Wide Stop - Balanced R:R",
      description: "Negative tick offset with stop-loss in the top 25% and R:R between 1 and 2. The market needs to come down to open the position."
    },

    // Trade style groups
    {
      type: SetupGroupType.BUY_STOP_SCALPING_STYLE,
      name: "Buy Stop - Scalping-Style Setups",
      description: "Positive tick offset with stop-loss in the bottom 25%, take-profit in the bottom 25%, and very short time limits. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_SCALPING_STYLE,
      name: "Buy Limit - Scalping-Style Setups",
      description: "Negative tick offset with stop-loss in the bottom 25%, take-profit in the bottom 25%, and very short time limits. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_DAY_TRADING_STYLE,
      name: "Buy Stop - Day-Trading Setups",
      description: "Positive tick offset with moderate stops and targets, time limits within the day. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_DAY_TRADING_STYLE,
      name: "Buy Limit - Day-Trading Setups",
      description: "Negative tick offset with moderate stops and targets, time limits within the day. The market needs to come down to open the position."
    },
    {
      type: SetupGroupType.BUY_STOP_SWING_TRADING_STYLE,
      name: "Buy Stop - Swing-Trading Setups",
      description: "Positive tick offset with wider stops and targets, time limits spanning several days. The market has to go up to open the position."
    },
    {
      type: SetupGroupType.BUY_LIMIT_SWING_TRADING_STYLE,
      name: "Buy Limit - Swing-Trading Setups",
      description: "Negative tick offset with wider stops and targets, time limits spanning several days. The market needs to come down to open the position."
    }
  ];
};

export default {
  groupSetups,
  getSetupGroupDescriptions,
  getSetupGroupDescriptionsMap,
  organizeSetupGroupsHierarchically,
  setupGroupHierarchy,
  SetupGroupType
};
