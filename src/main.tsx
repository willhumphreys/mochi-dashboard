// src/main.tsx or src/index.tsx
import React from 'react'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './AuthContext'
import {createRoot} from "react-dom/client";


createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,

)
