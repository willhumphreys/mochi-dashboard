import React from 'react';

interface BacktestExecutionParamsProps {
  executionParams: {
    tradeDuration: string;
    tradeTimeout: string;
  };
  setExecutionParams: (params: { tradeDuration: string; tradeTimeout: string }) => void;
}

// Presets for trade duration (in hours)
const durationPresets = [
  { label: '1 Day (24 hours)', value: '24' },
  { label: '2 Days (48 hours)', value: '48' },
  { label: '3 Days (72 hours)', value: '72' },
  { label: '1 Week (168 hours)', value: '168' },
  { label: '2 Weeks (336 hours)', value: '336' },
  { label: '30 Days (720 hours)', value: '720' },
];

// Presets for trade timeout (in hours)
const timeoutPresets = [
  { label: '1 Hour', value: '1' },
  { label: '2 Hours', value: '2' },
  { label: '4 Hours', value: '4' },
  { label: '8 Hours', value: '8' },
  { label: '12 Hours', value: '12' },
  { label: '24 Hours', value: '24' },
];

const BacktestExecutionParams: React.FC<BacktestExecutionParamsProps> = ({ 
  executionParams, 
  setExecutionParams 
}) => {
  const handleDurationPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      setExecutionParams({
        ...executionParams,
        tradeDuration: selectedValue
      });
    }
  };

  const handleTimeoutPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      setExecutionParams({
        ...executionParams,
        tradeTimeout: selectedValue
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExecutionParams({ ...executionParams, [name]: value });
  };

  return (
    <div className="backtest-execution-params">
      <h3>Backtest Execution Parameters</h3>

      <div className="form-group">
        <label htmlFor="tradeDuration">Trade Duration (hours):</label>
        <select 
          id="tradeDuration"
          onChange={handleDurationPresetChange} 
          value={executionParams.tradeDuration || ''}
        >
          <option value="">Select duration</option>
          {durationPresets.map((preset, index) => (
            <option key={index} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>

        <div className="manual-input">
          <input
            type="number"
            name="tradeDuration"
            value={executionParams.tradeDuration}
            onChange={handleInputChange}
            min="1"
            max="720"
            placeholder="Custom duration (1-720 hours)"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tradeTimeout">Trade Timeout (hours):</label>
        <select 
          id="tradeTimeout"
          onChange={handleTimeoutPresetChange}
          value={executionParams.tradeTimeout || ''}
        >
          <option value="">Select timeout</option>
          {timeoutPresets.map((preset, index) => (
            <option key={index} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>

        <div className="manual-input">
          <input
            type="number"
            name="tradeTimeout"
            value={executionParams.tradeTimeout}
            onChange={handleInputChange}
            min="1"
            max="24"
            placeholder="Custom timeout (1-24 hours)"
          />
        </div>
      </div>
    </div>
  );
};

export default BacktestExecutionParams;
