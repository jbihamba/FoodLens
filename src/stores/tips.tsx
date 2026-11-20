import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { generateTips } from '@/services/tips/engine';
import { dismissTipRule, readTipHistory, writeTipHistory } from '@/services/tips/history';
import { getTipStats } from '@/services/tips/stats';
import type { Tip, TipStats, TipHistory } from '@/services/tips/types';
import { useAppSettings } from '@/stores/app-settings';

interface TipsContextValue {
  tips: Tip[];
  stats: TipStats | null;
  isLoading: boolean;
  error: string | null;
  refreshTips: () => Promise<void>;
  dismissTip: (ruleId: string) => Promise<void>;
}

const TipsContext = createContext<TipsContextValue | null>(null);

export function TipsProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { settings } = useAppSettings();
  const displayName = settings.profile.displayName.trim() || null;
  const [tips, setTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState<TipStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tipsRef = useRef<Tip[]>([]);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const enqueue = useCallback(<T,>(task: () => Promise<T>) => {
    const operation = queueRef.current.then(task, task);
    queueRef.current = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }, []);

  const refreshTips = useCallback(
    () =>
      enqueue(async () => {
        setIsLoading(true);
        setError(null);
        try {
          const { stats: nextStats, goals } = await getTipStats(db);
          const history = await readTipHistory();
          const generated = generateTips(
            nextStats,
            goals,
            { displayName },
            history,
          );
          const previousByRule = new Map(
            tipsRef.current.map((tip) => [tip.ruleId, tip]),
          );
          const nextTips = generated.map((tip) => {
            const previous = previousByRule.get(tip.ruleId);
            return previous ? { ...tip, createdAt: previous.createdAt } : tip;
          });
          const nextHistory: TipHistory = {
            ...history,
            lastShownAt: { ...history.lastShownAt },
            activeRuleIds: nextTips.map((tip) => tip.ruleId),
          };
          for (const tip of nextTips) {
            if (!previousByRule.has(tip.ruleId)) {
              nextHistory.lastShownAt[tip.ruleId] = nextStats.generatedAt;
            }
          }

          await writeTipHistory(nextHistory);
          tipsRef.current = nextTips;
          setTips(nextTips);
          setStats(nextStats);
        } catch (cause) {
          const message =
            cause instanceof Error ? cause.message : 'Tips could not be updated.';
          setError(message);
          throw cause;
        } finally {
          setIsLoading(false);
        }
      }),
    [db, displayName, enqueue],
  );

  const dismissTip = useCallback(
    (ruleId: string) =>
      enqueue(async () => {
        setError(null);
        try {
          await dismissTipRule(ruleId);
          const nextTips = tipsRef.current.filter((tip) => tip.ruleId !== ruleId);
          tipsRef.current = nextTips;
          setTips(nextTips);
        } catch (cause) {
          const message =
            cause instanceof Error ? cause.message : 'Tip could not be dismissed.';
          setError(message);
          throw cause;
        }
      }),
    [enqueue],
  );

  useEffect(() => {
    void refreshTips().catch(() => undefined);
  }, [refreshTips]);

  const value = useMemo(
    () => ({ tips, stats, isLoading, error, refreshTips, dismissTip }),
    [tips, stats, isLoading, error, refreshTips, dismissTip],
  );

  return <TipsContext.Provider value={value}>{children}</TipsContext.Provider>;
}

export function useTips() {
  const value = useContext(TipsContext);
  if (!value) {
    throw new Error('useTips must be used within TipsProvider');
  }
  return value;
}
