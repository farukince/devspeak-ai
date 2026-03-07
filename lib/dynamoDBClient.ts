import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDBConfig, TABLES } from './awsConfig';

const client = new DynamoDBClient(dynamoDBConfig);
const docClient = DynamoDBDocumentClient.from(client);

export interface PracticeSession {
  userId: string;
  sessionId: string;
  createdAt: string;
  moduleType: string;
  taskName?: string;
  scores?: Record<string, number>;
  userInput: string;
  aiFeedback: string;
}

/**
 * Insert a new practice session
 */
export async function insertPracticeSession(session: Omit<PracticeSession, 'sessionId' | 'createdAt'>) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date().toISOString();

  const item: PracticeSession = {
    ...session,
    sessionId,
    createdAt,
  };

  const command = new PutCommand({
    TableName: TABLES.PRACTICE_SESSIONS,
    Item: item,
  });

  await docClient.send(command);
  return item;
}

/**
 * Get all practice sessions for a user
 */
export async function getUserPracticeSessions(userId: string): Promise<PracticeSession[]> {
  const command = new QueryCommand({
    TableName: TABLES.PRACTICE_SESSIONS,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: true, // Sort by createdAt ascending
  });

  const response = await docClient.send(command);
  return (response.Items as PracticeSession[]) || [];
}

/**
 * Get practice sessions by module type
 */
export async function getUserSessionsByModule(
  userId: string,
  moduleType: string
): Promise<PracticeSession[]> {
  const command = new QueryCommand({
    TableName: TABLES.PRACTICE_SESSIONS,
    IndexName: 'UserModuleIndex', // GSI needed
    KeyConditionExpression: 'userId = :userId AND moduleType = :moduleType',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':moduleType': moduleType,
    },
  });

  const response = await docClient.send(command);
  return (response.Items as PracticeSession[]) || [];
}

/**
 * Get recent sessions (last N sessions)
 */
export async function getRecentSessions(userId: string, limit: number = 5): Promise<PracticeSession[]> {
  const command = new QueryCommand({
    TableName: TABLES.PRACTICE_SESSIONS,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Sort descending (newest first)
    Limit: limit,
  });

  const response = await docClient.send(command);
  return (response.Items as PracticeSession[]) || [];
}

/**
 * User profile operations
 */
export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  birthday?: string;
  englishLevel?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const item: UserProfile = {
    ...profile,
    createdAt: now,
    updatedAt: now,
  };

  const command = new PutCommand({
    TableName: TABLES.USERS,
    Item: item,
  });

  await docClient.send(command);
  return item;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const command = new GetCommand({
    TableName: TABLES.USERS,
    Key: { userId },
  });

  const response = await docClient.send(command);
  return (response.Item as UserProfile) || null;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const updateExpression: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.keys(updates).forEach((key, index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpression.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = updates[key as keyof UserProfile];
  });

  // Always update the updatedAt timestamp
  updateExpression.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const command = new UpdateCommand({
    TableName: TABLES.USERS,
    Key: { userId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const response = await docClient.send(command);
  return response.Attributes as UserProfile;
}
