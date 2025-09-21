import { getIngredient } from './substitution';

export type Stage = 'seedling' | 'veg' | 'early-flower' | 'late-flower';

export type TemplateCtx = {
  stage: Stage;
  volumeLiters: number;
  aloePercent: number; // % v/v
  yuccaAvailable: boolean;
  aloeAvailable: boolean;
  onHand: string[];
  includeCarbs?: boolean;
  carbsPerL?: number; // Optional override for carbohydrate dose (per L in chosen unit)
  carbsSource?: string; // Optional label override for carbohydrate source
  carbsUnit?: 'ml' | 'g';
  carbsSourceKey?: 'molasses' | 'millet' | 'oat' | 'other';
};

export type RecipeItem = {
  id: string;
  name: string;
  amount: string; // friendly text, e.g., "2 ml per L (40 ml total)"
  note?: string;
};

type StageCarbDefault = {
  unit: 'ml' | 'g';
  dose: number;
  sourceKey: 'molasses' | 'millet' | 'oat';
  sourceLabel: string;
  note: string;
};

export const stageCarbDefaults: Record<Stage, StageCarbDefault> = {
  seedling: {
    unit: 'ml',
    dose: 1,
    sourceKey: 'molasses',
    sourceLabel: 'Molasses',
    note: 'Seedling default: keep carbs gentle (~1 ml/L).'
  },
  veg: {
    unit: 'ml',
    dose: 2,
    sourceKey: 'molasses',
    sourceLabel: 'Molasses',
    note: 'Vegetative default: sustain root building carbs (~2 ml/L).'
  },
  'early-flower': {
    unit: 'ml',
    dose: 3,
    sourceKey: 'molasses',
    sourceLabel: 'Molasses',
    note: 'Early flower default: ramp carbs for transition (~3 ml/L).'
  },
  'late-flower': {
    unit: 'ml',
    dose: 5,
    sourceKey: 'molasses',
    sourceLabel: 'Molasses',
    note: 'Late flower default: maintain energy (~5 ml/L).'
  }
};

function sourceKeyToIngredientId(key?: 'molasses' | 'millet' | 'oat' | 'other') {
  switch (key) {
    case 'millet':
      return 'pearlMillet';
    case 'oat':
      return 'oatFlour';
    case 'molasses':
      return 'molasses';
    default:
      return undefined;
  }
}

function totalFromPerLiter(unit: string, perL: number, L: number) {
  const total = perL * L;
  const round = (n: number) => Math.round(n * 100) / 100;
  return `${round(perL)} ${unit} per L (${round(total)} ${unit} total)`;
}

export function buildStageRecipe(ctx: TemplateCtx): RecipeItem[] {
  const L = ctx.volumeLiters;
  const items: RecipeItem[] = [];

  // Aloe (if available) at given % v/v
  if (ctx.aloeAvailable) {
    const perL = Math.round(10 * (ctx.aloePercent * 10)) / 10; // percent of 1000 ml => ml per L
    const total = Math.round(L * 1000 * (ctx.aloePercent / 100));
    items.push({
      id: 'aloe',
      name: 'Aloe vera juice',
      amount: `${perL} ml per L (${total} ml total)`,
      note: ctx.aloePercent > 10 ? 'Consider ~5% v/v for microbe-friendly brews' : undefined
    });
  }

  // Surfactant: prefer yucca if available; otherwise quillaja then soapwort
  if (ctx.yuccaAvailable) {
    const yucca = getIngredient('yucca');
    if (yucca) {
      items.push({
        id: 'yucca',
        name: yucca.name,
        amount: totalFromPerLiter(yucca.dosageRange.unit, yucca.dosageRange.default ?? yucca.dosageRange.min, L),
        note: 'Wetting agent'
      });
    }
  } else {
    const q = getIngredient('quillaja');
    if (q) {
      items.push({
        id: 'quillaja',
        name: q.name,
        amount: totalFromPerLiter(q.dosageRange.unit, q.dosageRange.default ?? q.dosageRange.min, L),
        note: 'Surfactant alternative'
      });
    }
  }

  // Stage-specific biostimulants
  const seaweed = getIngredient('seaweed');
  const humic = getIngredient('humic');
  const fulvic = getIngredient('fulvic');

  switch (ctx.stage) {
    case 'seedling':
      if (seaweed) {
        items.push({
          id: 'seaweed',
          name: seaweed.name,
          amount: totalFromPerLiter(
            seaweed.dosageRange.unit,
            Math.max(seaweed.dosageRange.min, (seaweed.dosageRange.default ?? seaweed.dosageRange.min) / 2),
            L
          ),
          note: 'Gentle tonic'
        });
      }
      break;
    case 'veg':
      if (seaweed) {
        items.push({
          id: 'seaweed',
          name: seaweed.name,
          amount: totalFromPerLiter(seaweed.dosageRange.unit, seaweed.dosageRange.default ?? seaweed.dosageRange.min, L)
        });
      }
      if (humic) {
        items.push({
          id: 'humic',
          name: humic.name,
          amount: totalFromPerLiter(humic.dosageRange.unit, humic.dosageRange.default ?? humic.dosageRange.min, L)
        });
      }
      break;
    case 'early-flower':
      if (seaweed) {
        items.push({
          id: 'seaweed',
          name: seaweed.name,
          amount: totalFromPerLiter(seaweed.dosageRange.unit, seaweed.dosageRange.default ?? seaweed.dosageRange.min, L)
        });
      }
      if (fulvic) {
        items.push({
          id: 'fulvic',
          name: fulvic.name,
          amount: totalFromPerLiter(fulvic.dosageRange.unit, fulvic.dosageRange.default ?? fulvic.dosageRange.min, L)
        });
      }
      break;
    case 'late-flower':
      if (fulvic) {
        items.push({
          id: 'fulvic',
          name: fulvic.name,
          amount: totalFromPerLiter(fulvic.dosageRange.unit, fulvic.dosageRange.default ?? fulvic.dosageRange.min, L),
          note: 'Supports uptake with carbohydrate strategy'
        });
      }
      break;
  }

  // Stage-aware carbohydrate guidance (applies whenever includeCarbs !== false)
  if (ctx.includeCarbs !== false) {
    const stageDefaults = stageCarbDefaults[ctx.stage];
    const preferredUnit = ctx.carbsUnit || stageDefaults?.unit || 'ml';
    const desiredDose = typeof ctx.carbsPerL === 'number' ? ctx.carbsPerL : stageDefaults?.dose;
    const sourceKey = ctx.carbsSourceKey || stageDefaults?.sourceKey;
    const sourceId = sourceKeyToIngredientId(sourceKey);
    const customLabel = ctx.carbsSource && ctx.carbsSource.trim() ? ctx.carbsSource.trim() : undefined;
    const noteBase = stageDefaults?.note;

    if (preferredUnit === 'g') {
      const dryIngredient = (sourceId ? getIngredient(sourceId) : undefined)
        || getIngredient('pearlMillet')
        || getIngredient('oatFlour');
      if (dryIngredient) {
        const desired = desiredDose ?? (dryIngredient.dosageRange.default ?? dryIngredient.dosageRange.min);
        const perL = Math.min(dryIngredient.dosageRange.max, Math.max(dryIngredient.dosageRange.min, desired));
        const label = customLabel || stageDefaults?.sourceLabel || dryIngredient.name;
        const noteParts = ['Dry carbohydrate - aim for steady feed'];
        if (noteBase) noteParts.push(noteBase);
        items.push({
          id: dryIngredient.id,
          name: label,
          amount: totalFromPerLiter(dryIngredient.dosageRange.unit, perL, L),
          note: noteParts.join('; ')
        });
      }
    } else {
      const liquidIngredient = (sourceId ? getIngredient(sourceId) : undefined) || getIngredient('molasses');
      if (liquidIngredient) {
        const desired = desiredDose ?? (liquidIngredient.dosageRange.default ?? liquidIngredient.dosageRange.min);
        const perL = Math.min(liquidIngredient.dosageRange.max, Math.max(liquidIngredient.dosageRange.min, desired));
        const label = customLabel || stageDefaults?.sourceLabel || liquidIngredient.name;
        const noteParts = ['Carb support - avoid spikes; steady feed'];
        if (noteBase) noteParts.push(noteBase);
        items.push({
          id: liquidIngredient.id,
          name: label,
          amount: totalFromPerLiter(liquidIngredient.dosageRange.unit, perL, L),
          note: noteParts.join('; ')
        });
      }
    }
  }

  // On-hand emphasis: note items the user already has
  items.forEach((item) => {
    if (ctx.onHand.includes(item.id)) {
      item.note = item.note ? `${item.note}; on hand` : 'On hand';
    }
  });

  return items;
}
