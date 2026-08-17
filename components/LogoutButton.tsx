'use client';

import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { LoaderCircle, LogOut } from 'lucide-react';
import { signOut } from '@/lib/authHelpers';

export function LogoutButton({
  className,
  children,
  showIcon = true,
  iconOnly = false,
  ariaLabel = 'Log out',
  onSignedOut,
}: {
  className?: string;
  children?: ReactNode;
  showIcon?: boolean;
  iconOnly?: boolean;
  ariaLabel?: string;
  onSignedOut?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorId = useId();

  const handleLogout = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signOut();
      onSignedOut?.();
      window.location.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setErrorMessage('Could not log out. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className={className}
        aria-label={ariaLabel}
        aria-describedby={errorMessage ? errorId : undefined}
        title={errorMessage || ariaLabel}
      >
        {showIcon && (loading
          ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          : <LogOut className="size-4" aria-hidden="true" />)}
        {iconOnly
          ? <span className="sr-only">{loading ? 'Signing out...' : ariaLabel}</span>
          : loading ? 'Signing out...' : children ?? 'Logout'}
      </button>
      <span id={errorId} className="sr-only" aria-live="polite">
        {errorMessage}
      </span>
    </>
  );
}
