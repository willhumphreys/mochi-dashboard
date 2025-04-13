// src/AddSetupForm.tsx
import {useEffect, useState} from 'react';
import {TradeData} from './types';
import {addTradeForSymbol} from './services/S3Service';

interface AddSetupFormProps {
    symbol: string;
    broker: string;
    onTradeAdded: (newTrade: TradeData) => void;
    disabled?: boolean;
}

const AddSetupForm: React.FC<AddSetupFormProps> = ({
                                                       symbol, broker, onTradeAdded, disabled = false
                                                   }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [shorthandInput, setShorthandInput] = useState<string>('');

// Add the parseShorthand function:
    const parseShorthand = () => {
        try {

            // Split by comma
            const parts = shorthandInput.split(',').map(part => part.trim());

            // Validate we have exactly 8 parts
            if (parts.length !== 8) {
                setError("Shorthand format requires exactly 8 values separated by commas.");
                return;
            }

            // Parse values
            const [traderId, dayOfWeek, hourOfDay, stop, limit, tickOffset, duration, outOfTime] = parts.map(p => parseInt(p, 10));

            // Validate all values are numbers
            if ([traderId, dayOfWeek, hourOfDay, stop, limit, tickOffset, duration, outOfTime].some(isNaN)) {
                setError("All values must be valid numbers.");
                return;
            }

            // Update the form state
            setTradeData({
                ...tradeData,
                traderid: traderId,
                dayofweek: dayOfWeek,
                hourofday: hourOfDay,
                stop: stop,
                limit: limit,
                tickoffset: tickOffset,
                tradeduration: duration,
                outoftime: outOfTime
            });

            // Clear any errors and show success
            setError(null);
            setSuccess("Shorthand successfully parsed!");
            setShorthandInput('');

            // Clear the shorthand input
            (document.getElementById('shorthand') as HTMLInputElement).value = '';
        } catch (err) {
            setError("Failed to parse shorthand: " + (err instanceof Error ? err.message : String(err)));
        }
    };


    // Form state
    const [tradeData, setTradeData] = useState<Partial<TradeData>>({
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

    // Update tradeData.broker when the broker prop changes
    useEffect(() => {
        setTradeData(prev => ({
            ...prev, broker: broker
        }));
    }, [broker]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        const numericFields = ['stop', 'limit', 'tickoffset', 'tradeduration', 'outoftime', 'dayofweek', 'hourofday'];

        setTradeData(prev => ({
            ...prev, [name]: numericFields.includes(name) ? Number(value) : value
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
                ...tradeData as TradeData, broker: broker
            };

            // Submit the trade
            await addTradeForSymbol(symbol, newTrade, broker);

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

            setSuccess(`Setup successfully added for ${symbol}`);

            onTradeAdded(newTrade);

            // Close the form after a delay
            setTimeout(() => {
                setIsFormOpen(false);
                setSuccess(null);
            }, 2000);

        } catch (err) {
            setError(`Failed to add setup: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this to the end of your component function:

    return (
        <div className="setup-container">
            {!isFormOpen ? (
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="open-form-button"
                    disabled={disabled}
                >
                    Add New Setup
                </button>
            ) : (
                <div className="setup-form-panel card">
                    <div className="card-header">
                        <h3>Add New Setup for {symbol}</h3>
                    </div>
                    <div className="card-body">
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        {/* Shorthand parser section */}
                        <div className="shorthand-parser">
                            <label htmlFor="shorthand">Shorthand Setup:</label>
                            <div className="shorthand-input-container">
                                <input
                                    type="text"
                                    id="shorthand"
                                    value={shorthandInput}
                                    onChange={(e) => setShorthandInput(e.target.value)}
                                    placeholder="e.g., 3,5,12,-2769,3727,-4,1008,8"
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    className="parse-button"
                                    onClick={parseShorthand}
                                >
                                    Parse
                                </button>
                            </div>
                            <small className="helper-text">Format: TraderId,DayOfWeek,HourOfDay,Stop,Limit,TickOffset,Duration,OutOfTime</small>
                        </div>

                        <form onSubmit={handleSubmit} className="setup-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="traderid">Trader ID:</label>
                                    <input
                                        type="number"
                                        id="traderid"
                                        name="traderid"
                                        value={tradeData.traderid}
                                        onChange={handleChange}
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dayofweek">Day of Week:</label>
                                    <input
                                        type="number"
                                        id="dayofweek"
                                        name="dayofweek"
                                        value={tradeData.dayofweek}
                                        onChange={handleChange}
                                        min="1"
                                        max="7"
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="hourofday">Hour of Day:</label>
                                    <input
                                        type="number"
                                        id="hourofday"
                                        name="hourofday"
                                        value={tradeData.hourofday}
                                        onChange={handleChange}
                                        min="0"
                                        max="23"
                                        required
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="submit-button"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Setup'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="cancel-button"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddSetupForm;