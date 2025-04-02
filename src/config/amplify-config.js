const amplifyConfig = {
    Auth: {
        region: import.meta.env.VITE_REGION,
        userPoolId: import.meta.env.VITE_USER_POOL_ID,
        userPoolWebClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
        oauth: {
            domain: import.meta.env.VITE_COGNITO_DOMAIN,
            scope: ['email', 'profile', 'openid'],
            redirectSignIn: 'https://master.d37eokvg7j9het.amplifyapp.com,http://localhost:5173',
            redirectSignOut: 'https://master.d37eokvg7j9het.amplifyapp.com,http://localhost:5173',
            responseType: 'code'
        }
    }
};

export default amplifyConfig;