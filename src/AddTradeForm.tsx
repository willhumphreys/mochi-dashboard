// src/AddTradeForm.tsx
import { useState, useEffect } from 'react';
import { TradeData } from './types';
import { addTradeForSymbol } from './services/S3Service';

interface AddTradeFormProps {
    symbol: string;
    broker: string;  // Add broker prop
    onTradeAdded: (newTrade: TradeData) => void;
    disabled?: boolean;  // Add disabled prop
}

const AddTradeForm: React.FC<AddTradeFormProps> = ({
                                                       symbol,
                                                       broker,
                                                       onTradeAdded,
                                                       disabled = false
                                                   }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [tradeData, setTradeData] = useState<Partial<TradeData>>({
        id: 0,
        traderid: 0,
        broker: broker,  // Initialize with the broker prop
        dayofweek: 1,
        hourofday: 9,
        stop: 0,
        limit: 0,
        tickoffset: 0,
        tradeduration: 0,
        outoftime: 0
    });

    // Update tradeData.broker when the broker prop changes
    useEffect(() => {
        setTradeData(prev => ({
            ...prev,
            broker: broker
        }));
    }, [broker]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['stop', 'limit', 'tickoffset', 'tradeduration', 'outoftime', 'dayofweek', 'hourofday'];

        setTradeData(prev => ({
            ...prev,
            [name]: numericFields.includes(name) ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // Ensure all required fields are present
            const newTrade = {
                ...tradeData as TradeData,
                broker: broker  // Ensure the broker is set correctly
            };

            // Submit the trade
            await addTradeForSymbol(symbol, newTrade, broker);  // Pass broker to the service

            // Reset form and show success message
            setTradeData({
                id: 0,
                traderid: 0,
                broker: broker,
                dayofweek: 1,
                hourofday: 9,
                stop: 0,
                limit: 0,
                tickoffset: 0,
                tradeduration: 0,
                outoftime: 0
            });

            setSuccess(`Trade successfully added for ${symbol} with broker ${broker}`);

            onTradeAdded(newTrade);

            // Close the form after a delay
            setTimeout(() => {
                setIsFormOpen(false);
                setSuccess(null);
            }, 2000);

        } catch (err) {
            setError(`Failed to add trade: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="add-trade-form-container">
            {!isFormOpen ? (
                <button
                    className="open-form-button"
                    onClick={() => setIsFormOpen(true)}
                    disabled={disabled}  // Use the disabled prop
                >
                    Add New Trade
                </button>
            ) : (
                <div className="form-panel">
                    <h3>Add New Trade for {symbol} with {broker}</h3>

                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="traderid">Trader ID:</label>
                            <input
                                type="text"
                                id="traderid"
                                name="traderid"
                                value={tradeData.traderid}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="broker">Broker:</label>
                            <input
                                type="text"
                                id="broker"
                                name="broker"
                                value={broker}
                                disabled
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="dayofweek">Day of Week (1-7):</label>
                            <select
                                id="dayofweek"
                                name="dayofweek"
                                value={tradeData.dayofweek}
                                onChange={handleChange}
                                required
                            >
                                <option value="1">Monday</option>
                                <option value="2">Tuesday</option>
                                <option value="3">Wednesday</option>
                                <option value="4">Thursday</option>
                                <option value="5">Friday</option>
                                <option value="6">Saturday</option>
                                <option value="7">Sunday</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="hourofday">Hour of Day (0-23):</label>
                            <input
                                type="number"
                                id="hourofday"
                                name="hourofday"
                                min="0"
                                max="23"
                                value={tradeData.hourofday}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="stop">Stop:</label>
                            <input
                                type="number"
                                id="stop"
                                name="stop"
                                value={tradeData.stop}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="limit">Limit:</label>
                            <input
                                type="number"
                                id="limit"
                                name="limit"
                                value={tradeData.limit}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="tickoffset">Tick Offset:</label>
                            <input
                                type="number"
                                id="tickoffset"
                                name="tickoffset"
                                value={tradeData.tickoffset}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="tradeduration">Trade Duration:</label>
                            <input
                                type="number"
                                id="tradeduration"
                                name="tradeduration"
                                value={tradeData.tradeduration}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="outoftime">Out of Time:</label>
                            <input
                                type="number"
                                id="outoftime"
                                name="outoftime"
                                value={tradeData.outoftime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Trade'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AddTradeForm;