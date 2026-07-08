import { useEffect } from "react";

export const useDatabaseSync = (onSync: () => void) => {
  useEffect(() => {
    const handleSync = () => {
      onSync();
    };
    window.addEventListener("database-sync", handleSync);
    return () => {
      window.removeEventListener("database-sync", handleSync);
    };
  }, [onSync]);
};
