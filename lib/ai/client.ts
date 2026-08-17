import 'server-only';
import { GoogleGenAI } from '@google/genai';
import { getAiConfig } from './config';

let client: GoogleGenAI | undefined;

export function getAiClient() {
  if (!client) client = new GoogleGenAI({ apiKey: getAiConfig().apiKey });
  return client;
}
