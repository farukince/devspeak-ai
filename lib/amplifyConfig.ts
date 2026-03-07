import { Amplify } from 'aws-amplify';
import { awsConfig } from './awsConfig';

// Configure Amplify for client-side
export function configureAmplify() {
  Amplify.configure(awsConfig, { ssr: true });
}
