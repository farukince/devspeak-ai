'use client';

import { Amplify } from 'aws-amplify';
import { awsConfig } from './awsConfig';
import { useEffect } from 'react';

// Configure Amplify for client-side
export function configureAmplify() {
  Amplify.configure(awsConfig, { ssr: true });
}

// Client-side component to configure Amplify
export function ConfigureAmplifyClientSide() {
  useEffect(() => {
    configureAmplify();
  }, []);

  return null;
}
