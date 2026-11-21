import { expect, test } from "@jest/globals";

import { translateTip } from "@/i18n/tips";

test("resolves translated metric names used as interpolation parameters", () => {
  const message = translateTip("tips.macros.message", "fr", {
    macro: "tips.metric.carbohydrates",
    percent: 68,
  });

  expect(message).toContain("glucides");
  expect(message).toContain("68 %");
});
