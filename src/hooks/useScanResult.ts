import { useCallback, useEffect, useReducer, useRef } from "react";

import { scanReducer, initialScanState, type ScanState } from "@/hooks/scanReducer";
import { runScanPipeline } from "@/services/scan/scanPipeline";

export interface ScanDraft { imageUri: string; imageBase64: string }

export function useScanResult(draft: ScanDraft | null) {
  const [state, dispatch] = useReducer(
    scanReducer,
    draft,
    (initialDraft) => initialDraft
      ? { ...initialScanState, status: "identifying" as const, imageUri: initialDraft.imageUri, imageBase64: initialDraft.imageBase64 }
      : initialScanState,
  );
  const scanId = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    if (!draft) return;
    controller.current?.abort();
    const currentId = ++scanId.current;
    const nextController = new AbortController();
    controller.current = nextController;
    dispatch({ type: "captureReady", imageUri: draft.imageUri, imageBase64: draft.imageBase64 });
    void runScanPipeline({ imageBase64: draft.imageBase64, signal: nextController.signal }, (event) => {
      if (currentId !== scanId.current || nextController.signal.aborted) return;
      dispatch(event.type === "failed" ? event : event);
    });
  }, [draft]);

  useEffect(() => {
    start();
    return () => {
      scanId.current += 1;
      controller.current?.abort();
    };
  }, [start]);

  const cancel = useCallback(() => {
    scanId.current += 1;
    controller.current?.abort();
    dispatch({ type: "cancelled" });
  }, []);
  const retry = useCallback(() => { dispatch({ type: "captureStarted" }); start(); }, [start]);
  const editName = useCallback((_name: string) => {
    // No name-based nutrition endpoint exists in the current service contract.
  }, []);
  const setPortion = useCallback((portion: number) => dispatch({ type: "portionChanged", portion }), []);

  return { state, retry, cancel, editName, setPortion } as {
    state: ScanState; retry: () => void; cancel: () => void;
    editName: (name: string) => void; setPortion: (portion: number) => void;
  };
}
