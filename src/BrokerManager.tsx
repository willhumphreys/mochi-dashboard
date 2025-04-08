// BrokerManager.tsx
import React, { useState, useEffect } from 'react';
import { getBrokers, addBroker, updateBroker, removeBroker, BrokerInfo } from './services/BrokerService';

const BrokerManager: React.FC = () => {
  const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for adding/editing brokers
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editingBroker, setEditingBroker] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    displayName: string;
    active: boolean;
  }>({
    name: '',
    displayName: '',
    active: true
  });
  
  // Load brokers on component mount
  useEffect(() => {
    fetchBrokers();
  }, []);
  
  // Fetch brokers from BrokerService
  const fetchBrokers = async () => {
    setLoading(true);
    try {
      const brokersList = await getBrokers();
      setBrokers(brokersList);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch brokers:', err);
      setError('Failed to load brokers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Open the add broker form
  const handleAddClick = () => {
    setFormMode('add');
    setFormData({
      name: '',
      displayName: '',
      active: true
    });
  };
  
  // Open the edit broker form
  const handleEditClick = (broker: BrokerInfo) => {
    setFormMode('edit');
    setEditingBroker(broker.name);
    setFormData({
      name: broker.name,
      displayName: broker.displayName,
      active: broker.active
    });
  };
  
  // Handle form submission for add/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (formMode === 'add') {
        await addBroker({
          name: formData.name.toLowerCase().trim(),
          displayName: formData.displayName.trim(),
          active: formData.active
        });
        setError(null);
        await fetchBrokers();
      } else if (formMode === 'edit' && editingBroker) {
        await updateBroker(editingBroker, {
          displayName: formData.displayName.trim(),
          active: formData.active
        });
        setError(null);
        await fetchBrokers();
      }
      
      // Reset form
      setFormMode(null);
      setEditingBroker(null);
    } catch (err: unknown) {
      console.error('Failed to save broker:', err);
      setError(err instanceof Error ? err.message : 'Failed to save broker. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle broker deletion
  const handleDeleteClick = async (brokerName: string) => {
    if (!window.confirm(`Are you sure you want to delete broker "${brokerName}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await removeBroker(brokerName);
      setError(null);
      await fetchBrokers();
    } catch (err: unknown) {
      console.error('Failed to delete broker:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete broker. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel form
  const handleCancel = () => {
    setFormMode(null);
    setEditingBroker(null);
    setError(null);
  };

  return (
    <div className="broker-manager">
      <div className="broker-manager-header">
        <h2>Broker Management</h2>
        <button 
          onClick={handleAddClick} 
          disabled={formMode !== null || loading}
          className="add-broker-btn"
        >
          Add New Broker
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Add/Edit Form */}
      {formMode && (
        <form onSubmit={handleSubmit} className="broker-form">
          <h3>{formMode === 'add' ? 'Add New Broker' : 'Edit Broker'}</h3>
          
          <div className="form-group">
            <label htmlFor="name">Broker ID:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={formMode === 'edit'} // Can't change broker ID when editing
              placeholder="e.g. my-broker"
              required
              pattern="^[a-z0-9-]+$"
              title="Lowercase letters, numbers, and hyphens only"
            />
            <small>Lowercase letters, numbers, and hyphens only</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name:</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="e.g. My Broker"
              required
            />
          </div>
          
          <div className="form-group checkbox">
            <label htmlFor="active">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
              />
              Active
            </label>
          </div>
          
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Broker'}
            </button>
            <button type="button" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {/* Brokers List */}
      <div className="brokers-list">
        {loading && !formMode ? (
          <div className="loading">Loading brokers...</div>
        ) : brokers.length === 0 ? (
          <div className="no-brokers">No brokers found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Broker ID</th>
                <th>Display Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map(broker => (
                <tr key={broker.name} className={broker.active ? 'active' : 'inactive'}>
                  <td>{broker.name}</td>
                  <td>{broker.displayName}</td>
                  <td>
                    <span className={`status ${broker.active ? 'active' : 'inactive'}`}>
                      {broker.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => handleEditClick(broker)}
                      disabled={formMode !== null || loading}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(broker.name)}
                      disabled={formMode !== null || loading || broker.name === 'darwinex'} // Prevent deleting default broker
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BrokerManager;