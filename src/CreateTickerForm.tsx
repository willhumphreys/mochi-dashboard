// src/CreateTickerForm.tsx
import { useState } from 'react';
import { createNewTicker } from './services/S3Service';

interface CreateTickerFormProps {
    onTickerCreated: (symbol: string) => void;
}

const CreateTickerForm: React.FC<CreateTickerFormProps> = ({ onTickerCreated }) => {
    const [newSymbol, setNewSymbol] = useState<string>('');
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // Validate input
        const symbolPattern = /^[A-Z]{1,5}$/;
        if (!symbolPattern.test(newSymbol)) {
            setError("Symbol must be 1-5 uppercase letters (e.g., AAPL, MSFT)");
            return;
        }

        setIsCreating(true);

        try {
            await createNewTicker(newSymbol);
            setSuccessMessage(`Ticker ${newSymbol} successfully created!`);
            setNewSymbol(''); // Clear the input
            onTickerCreated(newSymbol); // Notify parent component
        } catch (err) {
            setError(`Failed to create ticker: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="create-ticker-form">
            <h3>Create New Ticker</h3>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="new-symbol">Ticker Symbol:</label>
                    <input
                        id="new-symbol"
                        type="text"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                        placeholder="e.g., AAPL"
                        disabled={isCreating}
                        maxLength={5}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isCreating || !newSymbol}
                    className="create-button"
                >
                    {isCreating ? 'Creating...' : 'Create Ticker'}
                </button>
            </form>

            {error && <div className="error">{error}</div>}
            {successMessage && <div className="success">{successMessage}</div>}
        </div>
    );
};

export default CreateTickerForm;