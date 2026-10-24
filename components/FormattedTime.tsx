'use client';

import React, { useSyncExternalStore } from 'react';

interface FormattedTimeProps {
  timestamp: number | string;
  className?: string;
  format?: 'time' | 'full';
}

const emptySubscribe = () => () => {};

export const FormattedTime: React.FC<FormattedTimeProps> = ({
  timestamp,
  className = '',
  format = 'time',
}) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const d = new Date(timestamp);

  // Deterministic UTC string for SSR and initial client hydration
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  const ssrTime = `${hours}:${minutes}:${seconds} UTC`;

  if (!isMounted) {
    return (
      <span className={className} suppressHydrationWarning>
        {ssrTime}
      </span>
    );
  }

  // Once mounted in the browser, render in local user locale
  const localFormatted =
    format === 'time'
      ? d.toLocaleTimeString('ar-EG')
      : `${d.toLocaleDateString('ar-EG')} ${d.toLocaleTimeString('ar-EG')}`;

  return (
    <span className={className} suppressHydrationWarning>
      {localFormatted}
    </span>
  );
};
