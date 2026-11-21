import { describe, expect, test } from '@jest/globals';

import breakfastMissing from '../breakfastMissing';
import caloriesLow from '../caloriesLow';
import caloriesOver from '../caloriesOver';
import calorieTrend from '../calorieTrend';
import consistency from '../consistency';
import fiberLow from '../fiberLow';
import macroBalance from '../macroBalance';
import positive from '../positive';
import proteinLow from '../proteinLow';
import waterLow from '../waterLow';
import { makeStats, metric, TEST_GOALS, TEST_PROFILE } from '../../__tests__/fixtures';
import type { TipRule, TipStats } from '../../types';

interface RuleCase {
  name: string;
  rule: TipRule;
  triggered: TipStats;
  boundary: TipStats;
  outside: TipStats;
  insufficient: TipStats;
  boundaryTriggers: boolean;
}

const ruleCases: RuleCase[] = [
  {
    name: 'protein below reference',
    rule: proteinLow,
    triggered: makeStats({ proteins: metric(39) }),
    boundary: makeStats({ proteins: metric(40) }),
    outside: makeStats({ proteins: metric(40.01) }),
    insufficient: makeStats({ trackedDays: 2, proteins: metric(30) }),
    boundaryTriggers: true,
  },
  {
    name: 'calorie goal exceeded',
    rule: caloriesOver,
    triggered: makeStats({ daysAboveCalorieGoal: 5 }),
    boundary: makeStats({ daysAboveCalorieGoal: 4 }),
    outside: makeStats({ daysAboveCalorieGoal: 3 }),
    insufficient: makeStats({ trackedDays: 2, daysAboveCalorieGoal: 7 }),
    boundaryTriggers: true,
  },
  {
    name: 'calorie intake below reference',
    rule: caloriesLow,
    triggered: makeStats({
      calories: metric(1259),
      daysBelowSeventyPercentCalorieGoal: 4,
    }),
    boundary: makeStats({
      calories: metric(1260),
      daysBelowSeventyPercentCalorieGoal: 4,
    }),
    outside: makeStats({
      calories: metric(1000),
      daysBelowSeventyPercentCalorieGoal: 3,
    }),
    insufficient: makeStats({ trackedDays: 2, daysBelowSeventyPercentCalorieGoal: 7 }),
    boundaryTriggers: false,
  },
  {
    name: 'water goal',
    rule: waterLow,
    triggered: makeStats({ waterGoalDays: 2 }),
    boundary: makeStats({ waterGoalDays: 2 }),
    outside: makeStats({ waterGoalDays: 3 }),
    insufficient: makeStats({
      waterGoalDays: 2,
      water: metric(2000, 2),
    }),
    boundaryTriggers: true,
  },
  {
    name: 'fiber below reference',
    rule: fiberLow,
    triggered: makeStats({ fibers: metric(17.49) }),
    boundary: makeStats({ fibers: metric(17.5) }),
    outside: makeStats({ fibers: metric(17.5) }),
    insufficient: makeStats({ fibers: metric(10, 2) }),
    boundaryTriggers: false,
  },
  {
    name: 'tracking gap',
    rule: consistency,
    triggered: makeStats({ currentTrackingGapDays: 3 }),
    boundary: makeStats({ currentTrackingGapDays: 2 }),
    outside: makeStats({ currentTrackingGapDays: 1 }),
    insufficient: makeStats({ trackedDays: 2, currentTrackingGapDays: 4 }),
    boundaryTriggers: true,
  },
  {
    name: 'missing breakfast entries',
    rule: breakfastMissing,
    triggered: makeStats({ breakfastMissingDays: 6 }),
    boundary: makeStats({ breakfastMissingDays: 5 }),
    outside: makeStats({ breakfastMissingDays: 4 }),
    insufficient: makeStats({ trackedDays: 4, breakfastMissingDays: 4 }),
    boundaryTriggers: true,
  },
  {
    name: 'weekly calorie trend',
    rule: calorieTrend,
    triggered: makeStats(
      { calories: metric(1151) },
      { calories: metric(1000) },
    ),
    boundary: makeStats(
      { calories: metric(1150) },
      { calories: metric(1000) },
    ),
    outside: makeStats(
      { calories: metric(1149) },
      { calories: metric(1000) },
    ),
    insufficient: makeStats(
      { calories: metric(1600), trackedDays: 2 },
      { calories: metric(1000), trackedDays: 2 },
    ),
    boundaryTriggers: false,
  },
  {
    name: 'positive tracking milestone',
    rule: positive,
    triggered: makeStats({}, {}, 3),
    boundary: makeStats({}, {}, 3),
    outside: makeStats({ proteinGoalDays: 6 }, {}, 2),
    insufficient: makeStats({ trackedDays: 2 }, {}, 3),
    boundaryTriggers: true,
  },
  {
    name: 'macro balance',
    rule: macroBalance,
    triggered: makeStats({
      carbohydrates: metric(63.76),
      proteins: metric(20),
      fats: metric(10),
    }),
    boundary: makeStats({
      carbohydrates: metric(63.75),
      proteins: metric(20),
      fats: metric(10),
    }),
    outside: makeStats({
      carbohydrates: metric(60),
      proteins: metric(20),
      fats: metric(10),
    }),
    insufficient: makeStats({
      trackedDays: 2,
      carbohydrates: metric(100),
      proteins: metric(20),
      fats: metric(10),
    }),
    boundaryTriggers: false,
  },
];

describe.each(ruleCases)(
  '$name rule',
  ({ rule, triggered, boundary, outside, insufficient, boundaryTriggers }) => {

    test('returns a tip when its condition is met', () => {
      expect(rule(triggered, TEST_GOALS, TEST_PROFILE)).not.toBeNull();
    });

    test('handles the threshold boundary as specified', () => {
      expect(rule(boundary, TEST_GOALS, TEST_PROFILE) !== null).toBe(boundaryTriggers);
    });

    test('does not trigger just outside its threshold', () => {
      expect(rule(outside, TEST_GOALS, TEST_PROFILE)).toBeNull();
    });

    test('does not trigger with insufficient tracking data', () => {
      expect(rule(insufficient, TEST_GOALS, TEST_PROFILE)).toBeNull();
    });
  },
);

test('reports a downward calorie trend', () => {
  const stats = makeStats(
    { calories: metric(849) },
    { calories: metric(1000) },
  );

  expect(calorieTrend(stats, TEST_GOALS, TEST_PROFILE)?.titleKey).toBe(
    'tips.trend.down.title',
  );
});

test('encourages meeting the protein reference throughout the week', () => {
  const stats = makeStats({
    proteins: metric(55),
    proteinGoalDays: 7,
  });

  expect(positive(stats, TEST_GOALS, TEST_PROFILE)?.ruleId).toBe(
    'protein-goal-week',
  );
});
