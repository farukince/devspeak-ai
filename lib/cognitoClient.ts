import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { dynamoDBConfig } from './awsConfig';

const client = new CognitoIdentityProviderClient(dynamoDBConfig);

export interface SignUpParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  birthday?: string;
  englishLevel?: string;
}

/**
 * Sign up a new user with Cognito
 */
export async function signUpUser(params: SignUpParams) {
  const { email, password, firstName, lastName, jobTitle, birthday, englishLevel } = params;

  const userAttributes = [
    { Name: 'email', Value: email },
  ];

  if (firstName) userAttributes.push({ Name: 'given_name', Value: firstName });
  if (lastName) userAttributes.push({ Name: 'family_name', Value: lastName });
  if (jobTitle) userAttributes.push({ Name: 'custom:job_title', Value: jobTitle });
  if (birthday) userAttributes.push({ Name: 'birthdate', Value: birthday });
  if (englishLevel) userAttributes.push({ Name: 'custom:english_level', Value: englishLevel });

  const command = new SignUpCommand({
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    Username: email,
    Password: password,
    UserAttributes: userAttributes,
  });

  const response = await client.send(command);
  return response;
}

/**
 * Sign in user with email and password
 */
export async function signInUser(email: string, password: string) {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const response = await client.send(command);
  return response.AuthenticationResult;
}

/**
 * Get current user from access token
 */
export async function getCurrentUser(accessToken: string) {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await client.send(command);
  return response;
}

/**
 * Helper to extract user attributes
 */
export function parseUserAttributes(attributes: Array<{ Name: string; Value: string }>) {
  const parsed: Record<string, string> = {};
  attributes.forEach(attr => {
    parsed[attr.Name] = attr.Value;
  });
  return parsed;
}
