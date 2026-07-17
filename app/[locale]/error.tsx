'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h2 style={{ color: 'red' }}>Server Error</h2>
      <p><b>Message:</b> {error.message || '(hidden in production)'}</p>
      <p><b>Name:</b> {error.name}</p>
      <p><b>Digest:</b> {error.digest}</p>
      <pre style={{ background: '#f5f5f5', padding: '16px', overflow: 'auto', fontSize: '12px' }}>
        {error.stack}
      </pre>
      <button onClick={reset} style={{ marginTop: '16px', padding: '8px 16px' }}>
        Retry
      </button>
    </div>
  );
}
