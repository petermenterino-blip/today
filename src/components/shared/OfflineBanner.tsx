import { useConnection } from '../../context/ConnectionContext';

export default function OfflineBanner() {
  const { isOnline, checkConnection } = useConnection();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-yellow-900 px-4 py-2 text-sm font-medium flex items-center justify-center gap-3">
      <span>You are offline — showing cached data. Changes will sync when connection is restored.</span>
      <button
        onClick={() => checkConnection()}
        className="underline font-semibold hover:text-yellow-950"
      >
        Retry
      </button>
    </div>
  );
}
