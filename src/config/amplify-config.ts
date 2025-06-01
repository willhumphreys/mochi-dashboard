// src/amplify-config.ts
import { ResourcesConfig } from 'aws-amplify';

const amplifyConfig: ResourcesConfig = {
    Auth: {
        Cognito: {
            userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID as string,
            userPoolId: import.meta.env.VITE_USER_POOL_ID as string,
            signUpVerificationMethod: 'code',
            loginWith: {
                oauth: {
                    domain: import.meta.env.VITE_COGNITO_DOMAIN as string,
                    scopes: ['email', 'profile', 'openid'],
                    redirectSignIn: [
                        'https://master.d37eokvg7j9het.amplifyapp.com',
                        'https://dashboard.minoko.life',
                        'http://localhost:5173'
                    ],
                    redirectSignOut: [
                        'https://master.d37eokvg7j9het.amplifyapp.com',
                        'https://dashboard.minoko.life',
                        'http://localhost:5173'
                    ],
                    responseType: 'code'
                }
            }
        }
    }
};

export default amplifyConfig;
