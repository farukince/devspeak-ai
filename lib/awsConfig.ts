// AWS Configuration for Amplify, Cognito, DynamoDB, and Bedrock
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID!,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
          redirectSignOut: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
          responseType: 'code' as const,
        },
      },
    },
  },
};

export const dynamoDBConfig = {
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

export const bedrockConfig = {
  region: process.env.AWS_BEDROCK_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

// DynamoDB Table Names
export const TABLES = {
  PRACTICE_SESSIONS: process.env.DYNAMODB_PRACTICE_SESSIONS_TABLE || 'devspeak-practice-sessions',
  USERS: process.env.DYNAMODB_USERS_TABLE || 'devspeak-users',
};
