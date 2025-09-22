import { describe, expect, it } from 'vitest';
import { buildStageRecipe } from '../../domain/templates';

const baseCtx = {
  stage: 'late-flower' as const,
  volumeLiters: 20,
  aloePercent: 5,
  yuccaAvailable: false,
  aloeAvailable: true,
  onHand: [] as string[],
  includeCarbs: true,
};

describe('buildStageRecipe', () => {
  it('includes molasses for late-flower carbohydrate strategy', () => {
    const recipe = buildStageRecipe(baseCtx);
    const molasses = recipe.find((item) => item.id === 'molasses');
    expect(molasses).toBeDefined();
    expect(molasses?.amount).toMatch(/per L/);
  });

  it('clamps carbohydrate dose to safe range', () => {
    const recipe = buildStageRecipe({
      ...baseCtx,
      carbsPerL: 7,
    });
    const molasses = recipe.find((item) => item.id === 'molasses');
    expect(molasses?.amount).toMatch(/5 ml per L/);
    expect(molasses?.amount).not.toMatch(/ml\/L/);
  });

  it('marks on-hand items in notes', () => {
    const recipe = buildStageRecipe({
      ...baseCtx,
      onHand: ['fulvic'],
    });
    const fulvic = recipe.find((item) => item.id === 'fulvic');
    expect(fulvic?.note?.toLowerCase()).toContain('on hand');
  });
});
