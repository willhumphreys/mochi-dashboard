import React from 'react';

interface ScalingParamsSelectorProps {
  scalingParams: {
    shortATRPeriod: string;
    longATRPeriod: string;
    alpha: string;
  };
  setScalingParams: (params: { shortATRPeriod: string; longATRPeriod: string; alpha: string }) => void;
}

const presets = [
  {
    label: 'Commodities - Long Setup: Short: 10, Long: 40, Alpha: 0.6',
    data: { shortATRPeriod: 10, longATRPeriod: 40, alpha: 0.6 },
  },
  {
    label: 'Commodities - Short Setup: Short: 7, Long: 30, Alpha: 0.7',
    data: { shortATRPeriod: 7, longATRPeriod: 30, alpha: 0.7 },
  },
  {
    label: 'Stocks - Long Setup: Short: 7, Long: 30, Alpha: 0.4',
    data: { shortATRPeriod: 7, longATRPeriod: 30, alpha: 0.4 },
  },
  {
    label: 'Stocks - Short Setup: Short: 5, Long: 21, Alpha: 0.5',
    data: { shortATRPeriod: 5, longATRPeriod: 21, alpha: 0.5 },
  },
];


const ScalingParamsSelector: React.FC<ScalingParamsSelectorProps> = ({ scalingParams, setScalingParams }) => {
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(e.target.value, 10);
    if (!isNaN(selectedIndex) && presets[selectedIndex]) {
      const preset = presets[selectedIndex].data;
      setScalingParams({
        shortATRPeriod: preset.shortATRPeriod.toString(),
        longATRPeriod: preset.longATRPeriod.toString(),
        alpha: preset.alpha.toString(),
      });
    } else {
      // Reset if no valid selection
      setScalingParams({ shortATRPeriod: '', longATRPeriod: '', alpha: '' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScalingParams({ ...scalingParams, [name]: value });
  };

  return (
      <div className="scaling-params-selector">
        <label>Select Preset:</label>
        <select onChange={handlePresetChange} defaultValue="">
          <option value="">Select a preset</option>
          {presets.map((preset, index) => (
              <option key={index} value={index.toString()}>
                {preset.label}
              </option>
          ))}
        </select>

        {/* Manual override inputs */}
        <div className="manual-inputs" style={{ marginTop: '1em' }}>
          <label style={{ display: 'block', marginTop: '0.5em' }}>
            Short ATR Period:
            <input
                type="number"
                name="shortATRPeriod"
                value={scalingParams.shortATRPeriod}
                onChange={handleInputChange}
            />
          </label>
          <label style={{ display: 'block', marginTop: '0.5em' }}>
            Long ATR Period:
            <input
                type="number"
                name="longATRPeriod"
                value={scalingParams.longATRPeriod}
                onChange={handleInputChange}
            />
          </label>
          <label style={{ display: 'block', marginTop: '0.5em' }}>
            Alpha:
            <input
                type="number"
                step="0.01"
                name="alpha"
                value={scalingParams.alpha}
                onChange={handleInputChange}
            />
          </label>
        </div>
      </div>
  );
};

export default ScalingParamsSelector;