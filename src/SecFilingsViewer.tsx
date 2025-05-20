// SecFilingsViewer.tsx
import React, { useState, useEffect } from 'react';
import { getSecFilingPeople, getAllSecFilingsWithChanges } from './services/SecFilingsService';
import { SecFiling } from './types';
import './SecFilingsViewer.css'; // We'll create this CSS file next

interface SecFilingsViewerProps {
  initialPersonId?: string;
}

export const SecFilingsViewer: React.FC<SecFilingsViewerProps> = ({ initialPersonId }) => {
  // State for people with SEC filings
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(initialPersonId || '');

  // State for filings data
  const [filings, setFilings] = useState<SecFiling[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for UI
  const [activeTab, setActiveTab] = useState<'holdings' | 'changes'>('holdings');

  // Load people on component mount
  useEffect(() => {
    const loadPeople = async () => {
      try {
        const peopleList = await getSecFilingPeople();
        setPeople(peopleList);

        // Set default selected person if not provided
        if (!initialPersonId && peopleList.length > 0) {
          setSelectedPersonId(peopleList[0].id);
        }
      } catch (err) {
        console.error('Failed to load SEC filing people:', err);
        setError('Failed to load people with SEC filings.');
      }
    };

    loadPeople();
  }, [initialPersonId]);

  // Load filings when selected person changes
  useEffect(() => {
    if (!selectedPersonId) return;

    const loadFilings = async () => {
      setLoading(true);
      setError(null);

      try {
        const filingsData = await getAllSecFilingsWithChanges(selectedPersonId);
        setFilings(filingsData);
      } catch (err) {
        console.error('Failed to load SEC filings:', err);
        setError('Failed to load SEC filings data.');
      } finally {
        setLoading(false);
      }
    };

    loadFilings();
  }, [selectedPersonId]);

  // Handle person selection change
  const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPersonId(e.target.value);
  };

  // Get the most recent filing
  const latestFiling = filings.length > 0 ? filings[filings.length - 1] : null;

  // Format currency value
  const formatCurrency = (value: number): string => {
    // The values are in cents, so divide by 100 to get dollars
    const dollars = value / 100;

    // Format with commas and dollar sign
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(dollars);
  };

  // Format number with commas
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Render the holdings tab (latest filing)
  const renderHoldingsTab = () => {
    if (!latestFiling) return <div>No filing data available</div>;

    return (
      <div className="holdings-tab">
        <h3>Holdings as of {latestFiling.filingDate}</h3>
        <table className="sec-filings-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company</th>
              <th>Shares</th>
              <th>Value</th>
              <th>Class</th>
            </tr>
          </thead>
          <tbody>
            {latestFiling.positions
              .filter(position => position.TotalShares > 0) // Only show current holdings
              .sort((a, b) => b.TotalValue - a.TotalValue) // Sort by value (descending)
              .map(position => (
                <tr key={position.Cusip}>
                  <td>{position.Ticker}</td>
                  <td>{position.Issuer}</td>
                  <td className="number-cell">{formatNumber(position.TotalShares)}</td>
                  <td className="number-cell">{formatCurrency(position.TotalValue)}</td>
                  <td>{position.Class}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render the changes tab (comparing latest filing with previous)
  const renderChangesTab = () => {
    if (filings.length < 2) return <div>Need at least two filings to show changes</div>;

    const latestFiling = filings[filings.length - 1];
    const previousDate = filings[filings.length - 2].filingDate;

    return (
      <div className="changes-tab">
        <h3>Changes from {previousDate} to {latestFiling.filingDate}</h3>
        <table className="sec-filings-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company</th>
              <th>Current Shares</th>
              <th>Change</th>
              <th>% Change</th>
              <th>Current Value</th>
            </tr>
          </thead>
          <tbody>
            {latestFiling.positions
              .sort((a, b) => {
                // Sort by absolute percent change (descending)
                const absChangeA = Math.abs(a.PercentChange || 0);
                const absChangeB = Math.abs(b.PercentChange || 0);
                return absChangeB - absChangeA;
              })
              .map(position => {
                // Determine CSS class based on change
                const changeClass = !position.Change ? '' :
                  position.Change > 0 ? 'positive-change' : 'negative-change';

                return (
                  <tr key={position.Cusip} className={changeClass}>
                    <td>{position.Ticker}</td>
                    <td>{position.Issuer}</td>
                    <td className="number-cell">{formatNumber(position.TotalShares)}</td>
                    <td className="number-cell">
                      {position.Change !== undefined ? formatNumber(position.Change) : 'N/A'}
                    </td>
                    <td className="number-cell">
                      {position.PercentChange !== undefined 
                        ? `${position.PercentChange > 0 ? '+' : ''}${position.PercentChange.toFixed(2)}%` 
                        : 'N/A'}
                    </td>
                    <td className="number-cell">{formatCurrency(position.TotalValue)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="sec-filings-viewer">
      <div className="sec-filings-header">
        <h2>SEC Filings Viewer</h2>

        <div className="sec-filings-controls">
          <div className="person-selector">
            <label htmlFor="person-select">Person/Entity:</label>
            <select 
              id="person-select" 
              value={selectedPersonId} 
              onChange={handlePersonChange}
              disabled={loading || people.length === 0}
            >
              {people.length === 0 && <option value="">Loading...</option>}
              {people.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div className="tab-selector">
            <button 
              className={`tab-button ${activeTab === 'holdings' ? 'active' : ''}`}
              onClick={() => setActiveTab('holdings')}
              disabled={loading}
            >
              Current Holdings
            </button>
            <button 
              className={`tab-button ${activeTab === 'changes' ? 'active' : ''}`}
              onClick={() => setActiveTab('changes')}
              disabled={loading || filings.length < 2}
            >
              Recent Changes
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-indicator">Loading SEC filings data...</div>
      ) : (
        <div className="sec-filings-content">
          {activeTab === 'holdings' ? renderHoldingsTab() : renderChangesTab()}
        </div>
      )}
    </div>
  );
};

export default SecFilingsViewer;
