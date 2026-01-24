import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

type AdminAccessContextValue = {
  verified: boolean;
  setVerified: (verified: boolean) => void;
  reset: () => void;
};

const AdminAccessContext = createContext<AdminAccessContextValue | null>(null);

export function AdminAccessProvider({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false);
  const location = useLocation();

  // Requirement: always ask again when entering the admin area.
  // So we reset verification as soon as the user leaves /admin.
  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      setVerified(false);
    }
  }, [location.pathname]);

  const value = useMemo<AdminAccessContextValue>(
    () => ({
      verified,
      setVerified,
      reset: () => setVerified(false),
    }),
    [verified]
  );

  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess() {
  const ctx = useContext(AdminAccessContext);
  if (!ctx) {
    throw new Error("useAdminAccess must be used within AdminAccessProvider");
  }
  return ctx;
}
