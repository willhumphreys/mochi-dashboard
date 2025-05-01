// src/CreateTickerForm.tsx
import {useState} from 'react';
import {createNewTicker} from './services/S3Service';

interface CreateTickerFormProps {
    onTickerCreated: (symbol: string) => void;
    broker: string;
}

const CreateTickerForm: React.FC<CreateTickerFormProps> = ({onTickerCreated, broker}) => {
    const [newSymbol, setNewSymbol] = useState<string>('');
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // Validate only the base symbol (user input)
        const symbolPattern = /^[A-Z]{1,6}$/;
        if (!symbolPattern.test(newSymbol)) {
            setError("Symbol must be 1-6 uppercase letters (e.g., AAPL, MSFT)");
            return;
        }

        setIsCreating(true);

        try {
            // Create the long position ticker
            const longSymbol = `${newSymbol}-long`;
            await createNewTicker(longSymbol, broker);

            // Create the short position ticker
            const shortSymbol = `${newSymbol}-short`;
            await createNewTicker(shortSymbol, broker);

            setSuccessMessage(`Tickers ${longSymbol} and ${shortSymbol} successfully created!`);
            setNewSymbol(''); // Clear the input

            // Notify parent component - passing the base symbol
            onTickerCreated(newSymbol);
        } catch (err) {
            // Check if the error is from the S3Service validation
            const errorMessage = err instanceof Error ? err.message : String(err);

            // If this is the case, provide a clearer message about what's happening
            if (errorMessage.includes("Symbol must be")) {
                setError("Internal validation error: Please contact the developer to update the S3Service validation.");
            } else {
                setError(`Failed to create tickers: ${errorMessage}`);
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (<div className="create-setups-form">
        <form onSubmit={handleSubmit}>
            <div className="form-controls">
                <input
                    id="new-symbol"
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL"
                    disabled={isCreating}
                    maxLength={6}
                    className="symbol-input"
                />
                <button
                    type="submit"
                    disabled={isCreating || !newSymbol}
                    className="create-button"
                >
                    {isCreating ? 'Creating...' : 'Create Long/Short Setups'}
                </button>
            </div>
        </form>


        <div className="form-help">
                <small>
                    This will create two
                    entries: {newSymbol ? `${newSymbol}-long and ${newSymbol}-short` : 'SYMBOL-long and SYMBOL-short'}
                </small>
            </div>

            {error && <div className="error">{error}</div>}
            {successMessage && <div className="success">{successMessage}</div>}
        </div>);
};

export default CreateTickerForm;