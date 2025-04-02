// src/Login.tsx
import React from 'react';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
    const { signIn } = useAuth();

    return (
        <div className="login-container">
            <h1>Welcome to Strategy Performance Dashboard</h1>
            <p>Please sign in to continue</p>
            <button
                onClick={() => {
                    console.log('Sign in button clicked');
                    signIn();
                }}
                className="sign-in-button"
            >
                Sign In
            </button>
        </div>
    );
};

export default Login;