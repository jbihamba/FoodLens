import { describe, expect, test } from '@jest/globals';

import { generateTips } from '../engine';
import { makeStats, metric, TEST_GOALS, TEST_PROFILE, TEST_DATE } from './fixtures';
import type { TipHistory } from '../types';

const emptyHistory: TipHistory = {
  lastShownAt: {},
  dismissedUntil: {},
  activeRuleIds: [],
};

describe('generateTips', () => {
  test('sorts by severity, keeps at most three tips, and includes a positive tip', () => {
    const stats = makeStats(
      {
        daysAboveCalorieGoal: 4,
        proteins: metric(20),
        carbohydrates: metric(63.76),
        fats: metric(10),
        fibers: metric(10),
        waterGoalDays: 2,
        breakfastMissingDays: 5,
        calories: metric(1900),
      },
      { calories: metric(1000) },
      3,
    );

    const tips = generateTips(stats, TEST_GOALS, TEST_PROFILE);

    expect(tips).toHaveLength(3);
    expect(tips[0].severity).toBe('attention');
    expect(tips.some((tip) => tip.severity === 'positive')).toBe(true);
    expect(
      tips.map((tip) => tip.severity),
    ).toEqual(['attention', 'info', 'positive']);
  });

  test('suppresses a recently shown rule but preserves an active one', () => {
    const stats = makeStats({ proteins: metric(30) });
    const shownRecently: TipHistory = {
      ...emptyHistory,
      lastShownAt: { 'protein-low': new Date(Date.parse(TEST_DATE) - 24 * 60 * 60 * 1000).toISOString() },
    };

    expect(
      generateTips(stats, TEST_GOALS, TEST_PROFILE, shownRecently).some(
        (tip) => tip.ruleId === 'protein-low',
      ),
    ).toBe(false);
    expect(
      generateTips(stats, TEST_GOALS, TEST_PROFILE, {
        ...shownRecently,
        activeRuleIds: ['protein-low'],
      }).some((tip) => tip.ruleId === 'protein-low'),
    ).toBe(true);
  });

  test('allows a rule to appear again after the three-day cooldown', () => {
    const stats = makeStats({ proteins: metric(30) });
    const history: TipHistory = {
      ...emptyHistory,
      lastShownAt: {
        'protein-low': new Date(
          Date.parse(TEST_DATE) - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    };

    expect(
      generateTips(stats, TEST_GOALS, TEST_PROFILE, history).some(
        (tip) => tip.ruleId === 'protein-low',
      ),
    ).toBe(true);
  });

  test('does not repeat a dismissed rule before its dismissal date', () => {
    const stats = makeStats({ proteins: metric(30) });
    const history: TipHistory = {
      ...emptyHistory,
      dismissedUntil: {
        'protein-low': new Date(Date.parse(TEST_DATE) + 24 * 60 * 60 * 1000).toISOString(),
      },
      activeRuleIds: ['protein-low'],
    };

    expect(
      generateTips(stats, TEST_GOALS, TEST_PROFILE, history).some(
        (tip) => tip.ruleId === 'protein-low',
      ),
    ).toBe(false);
  });

  test('allows a dismissed rule after the seven-day cooldown', () => {
    const stats = makeStats({ proteins: metric(30) });
    const history: TipHistory = {
      ...emptyHistory,
      dismissedUntil: { 'protein-low': TEST_DATE },
    };

    expect(
      generateTips(stats, TEST_GOALS, TEST_PROFILE, history).some(
        (tip) => tip.ruleId === 'protein-low',
      ),
    ).toBe(true);
  });

  test('does not show contradictory calorie tips', () => {
    const stats = makeStats({
      calories: metric(1200),
      daysAboveCalorieGoal: 4,
      daysBelowSeventyPercentCalorieGoal: 4,
    });

    const ruleIds = generateTips(stats, TEST_GOALS, TEST_PROFILE).map((tip) => tip.ruleId);

    expect(ruleIds).toContain('calories-over-goal');
    expect(ruleIds).not.toContain('calories-below-goal');
  });

  test('returns no tips before three tracked days', () => {
    const stats = makeStats({ trackedDays: 2, proteins: metric(20) });

    expect(generateTips(stats, TEST_GOALS, TEST_PROFILE)).toEqual([]);
  });
});
