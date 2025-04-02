// src/Login.tsx
import { useAuth } from './AuthContext';
import './App.css';

function Login() {
    const { signIn } = useAuth();

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Mochi Dashboard</h1>
                <p>You need to sign in to access the dashboard</p>
                <button className="login-button" onClick={signIn}>
                    Sign in with Cognito
                </button>
            </div>
        </div>
    );
}

export default Login;