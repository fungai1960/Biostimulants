import { z } from 'zod';

export const FunctionalRole = z.enum([
  'surfactant',
  'prebiotic',
  'inoculant',
  'biostimulant',
  'elicitor'
]);

export const DosageRange = z.object({
  unit: z.string(),
  min: z.number(),
  max: z.number(),
  default: z.number().optional(),
});

export const Ingredient = z.object({
  id: z.string(),
  name: z.string(),
  functionalRoles: z.array(FunctionalRole),
  potencyScore: z.number().min(0).max(1).default(0.5),
  dosageRange: DosageRange,
  notes: z.string().optional(),
  citations: z.array(z.string()).default([]),
  availability: z.object({ regions: z.array(z.string()).default([]), status: z.enum(['common','limited','rare']).default('common') }).default({ regions: [], status: 'common' }),
  substitutes: z.array(z.string()).default([]),
});

export type IngredientT = z.infer<typeof Ingredient>;
