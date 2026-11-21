import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { ScanSession } from "@/types/food";

interface ScanSessionContextValue {
  scan: ScanSession | null;
  saveScan: (scan: ScanSession) => void;
  clearScan: () => void;
}

const ScanSessionContext = createContext<ScanSessionContextValue | null>(null);

export function ScanSessionProvider({ children }: PropsWithChildren) {
  const [scan, setScan] = useState<ScanSession | null>(null);
  const value = useMemo(
    () => ({
      scan,
      saveScan: setScan,
      clearScan: () => setScan(null),
    }),
    [scan],
  );

  return (
    <ScanSessionContext.Provider value={value}>
      {children}
    </ScanSessionContext.Provider>
  );
}

export function useScanSession() {
  const value = useContext(ScanSessionContext);
  if (!value) {
    throw new Error("useScanSession must be used within ScanSessionProvider");
  }
  return value;
}
