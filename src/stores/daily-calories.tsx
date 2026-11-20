import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';

import {
  addFoodEntry as insertFoodEntry,
  deleteFoodEntry as removeFoodEntry,
  getDailyGoal,
  getFoodEntriesForLocalDay,
  updateDailyGoal as persistDailyGoal,
  updateFoodEntry as persistFoodEntry,
  type DailyGoal,
  type FoodEntry,
  type FoodEntryInput,
} from '@/services/calorieTracking';
import { useTips } from '@/stores/tips';

interface DailyCaloriesContextValue {
  goal: DailyGoal | null;
  entries: FoodEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setGoal: (calories: number) => Promise<void>;
  addEntry: (entry: FoodEntryInput) => Promise<number>;
  updateEntry: (id: number, entry: FoodEntryInput) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
}

const DailyCaloriesContext = createContext<DailyCaloriesContextValue | null>(null);

export function DailyCaloriesProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const { refreshTips } = useTips();
  const [goal, setGoalState] = useState<DailyGoal | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [nextGoal, todayEntries] = await Promise.all([
        getDailyGoal(db),
        getFoodEntriesForLocalDay(db),
      ]);
      setGoalState(nextGoal);
      setEntries(todayEntries);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load calorie data.');
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const refreshTipsAfterDataChange = useCallback(async () => {
    try {
      await refreshTips();
    } catch (cause) {
      console.error('[tips] Could not refresh after calorie data changed:', cause);
    }
  }, [refreshTips]);

  useEffect(() => {
    void Promise.resolve()
      .then(refresh)
      .catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNextDayRefresh = () => {
      const nextDay = new Date();
      nextDay.setHours(24, 0, 0, 50);
      timer = setTimeout(() => {
        void refresh().catch(() => undefined);
        scheduleNextDayRefresh();
      }, Math.max(nextDay.getTime() - Date.now(), 1000));
    };

    scheduleNextDayRefresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh().catch(() => undefined);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [refresh]);

  const setGoal = useCallback(
    async (calories: number) => {
      await persistDailyGoal(db, calories);
      await refresh();
      await refreshTipsAfterDataChange();
    },
    [db, refresh, refreshTipsAfterDataChange],
  );

  const addEntry = useCallback(
    async (entry: FoodEntryInput) => {
      const id = await insertFoodEntry(db, entry);
      await refresh();
      await refreshTipsAfterDataChange();
      return id;
    },
    [db, refresh, refreshTipsAfterDataChange],
  );

  const updateEntry = useCallback(
    async (id: number, entry: FoodEntryInput) => {
      await persistFoodEntry(db, id, entry);
      await refresh();
      await refreshTipsAfterDataChange();
    },
    [db, refresh, refreshTipsAfterDataChange],
  );

  const deleteEntry = useCallback(
    async (id: number) => {
      await removeFoodEntry(db, id);
      await refresh();
      await refreshTipsAfterDataChange();
    },
    [db, refresh, refreshTipsAfterDataChange],
  );

  const value = useMemo(
    () => ({
      goal,
      entries,
      isLoading,
      error,
      refresh,
      setGoal,
      addEntry,
      updateEntry,
      deleteEntry,
    }),
    [
      goal,
      entries,
      isLoading,
      error,
      refresh,
      setGoal,
      addEntry,
      updateEntry,
      deleteEntry,
    ],
  );

  return <DailyCaloriesContext.Provider value={value}>{children}</DailyCaloriesContext.Provider>;
}

export function useDailyCalories() {
  const value = useContext(DailyCaloriesContext);
  if (!value) {
    throw new Error('useDailyCalories must be used within DailyCaloriesProvider');
  }
  return value;
}
