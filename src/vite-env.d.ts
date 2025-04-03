/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Existing variables
    readonly VITE_USER_POOL_ID: string;
    readonly VITE_USER_POOL_CLIENT_ID: string;
    readonly VITE_REGION: string;
    readonly VITE_COGNITO_DOMAIN: string;

    // Added AWS credentials
    readonly VITE_AWS_ACCESS_KEY_ID: string;
    readonly VITE_AWS_SECRET_ACCESS_KEY: string;
    readonly VITE_AWS_REGION: string;
    readonly VITE_AWS_SESSION_TOKEN: string;
    readonly VITE_COGNITO_IDENTITY_POOL_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}