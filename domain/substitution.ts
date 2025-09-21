import type { IngredientT } from './schemas';

export type SubContext = {
  region?: string;
  onHand?: string[];
  desiredRole?: 'surfactant' | 'prebiotic' | 'inoculant' | 'biostimulant' | 'elicitor';
};

// Minimal in-memory catalog to demonstrate logic.
const catalog: Record<string, IngredientT> = {
  yucca: {
    id: 'yucca',
    name: 'Yucca schidigera extract',
    functionalRoles: ['surfactant'],
    potencyScore: 0.9,
    dosageRange: { unit: 'ml/L', min: 0.05, max: 0.5, default: 0.1 },
    notes: 'Saponins reduce surface tension; supports microbes; mitigates salts.',
    citations: ['22','25'],
    availability: { regions: ['US','CA','EU'], status: 'limited' },
    substitutes: ['quillaja','soapwort']
  },
  quillaja: {
    id: 'quillaja',
    name: 'Quillaja saponaria (soapbark) extract',
    functionalRoles: ['surfactant'],
    potencyScore: 0.85,
    dosageRange: { unit: 'ml/L', min: 0.05, max: 0.4, default: 0.1 },
    notes: 'High saponin content; effective wetting agent; widely available. Caution with foliar at high dose.',
    citations: ['garden-wetting-agents'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: ['soapwort']
  },
  soapwort: {
    id: 'soapwort',
    name: 'Saponaria officinalis (soapwort)',
    functionalRoles: ['surfactant'],
    potencyScore: 0.6,
    dosageRange: { unit: 'g/L', min: 0.5, max: 3, default: 1 },
    notes: 'Traditional saponin source; steeped decoction. Lower potency, but globally accessible.',
    citations: ['traditional-saponins'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: []
  },
  aloe: {
    id: 'aloe',
    name: 'Aloe vera juice',
    functionalRoles: ['biostimulant','surfactant'],
    potencyScore: 0.5,
    dosageRange: { unit: '% v/v', min: 0.5, max: 25, default: 5 },
    notes: 'At ~5% promotes Lactobacillus; >25% may inhibit microbes.',
    citations: ['31'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: []
  },
  seaweed: {
    id: 'seaweed',
    name: 'Seaweed extract (e.g., Ascophyllum nodosum)',
    functionalRoles: ['biostimulant'],
    potencyScore: 0.7,
    dosageRange: { unit: 'ml/L', min: 1, max: 5, default: 2 },
    notes: 'Hormones (auxins/cytokinins), alginates improve structure/water holding; broad biostimulant.',
    citations: ['16','20','23'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: []
  },
  humic: {
    id: 'humic',
    name: 'Humic acids',
    functionalRoles: ['biostimulant'],
    potencyScore: 0.6,
    dosageRange: { unit: 'ml/L', min: 1, max: 4, default: 2 },
    notes: 'Improves CEC, chelation, root growth; complements fulvic.',
    citations: ['18'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: ['fulvic']
  },
  fulvic: {
    id: 'fulvic',
    name: 'Fulvic acids',
    functionalRoles: ['biostimulant'],
    potencyScore: 0.6,
    dosageRange: { unit: 'ml/L', min: 0.5, max: 2, default: 1 },
    notes: 'Small molecules; enhances nutrient uptake; often paired with humic.',
    citations: ['18'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: ['humic']
  },
  comfrey: {
    id: 'comfrey',
    name: 'Comfrey leaf tea (Symphytum spp.)',
    functionalRoles: ['biostimulant'],
    potencyScore: 0.5,
    dosageRange: { unit: 'g/L', min: 5, max: 20, default: 10 },
    notes: 'Growable input; potassium-rich leafy tea used as tonic. Compost safely; avoid ingestion claims.',
    citations: ['traditional-comfrey'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: []
  },
  molasses: {
    id: 'molasses',
    name: 'Unsulfured molasses',
    functionalRoles: ['prebiotic'],
    potencyScore: 0.5,
    dosageRange: { unit: 'ml/L', min: 1, max: 5, default: 2 },
    notes: 'Carbohydrate source to feed microbes; avoid excessive spikes.',
    citations: ['traditional-molasses'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: []
  },
  oatFlour: {
    id: 'oatFlour',
    name: 'Oat flour (finely milled)',
    functionalRoles: ['prebiotic'],
    potencyScore: 0.6,
    dosageRange: { unit: 'g/L', min: 2, max: 10, default: 5 },
    notes: 'Dry carbohydrate with beta‑glucans; supports microbial growth when hydrated/aerated.',
    citations: ['oat-prebiotic-tradition'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: []
  },
  pearlMillet: {
    id: 'pearlMillet',
    name: 'Pearl millet flour (finely milled)',
    functionalRoles: ['prebiotic'],
    potencyScore: 0.7,
    dosageRange: { unit: 'g/L', min: 2, max: 10, default: 5 },
    notes: 'High-energy dry carbohydrate; superior performance in trials for microbial activity.',
    citations: ['millet-prebiotic-tradition'],
    availability: { regions: ['GLOBAL'], status: 'common' },
    substitutes: ['oatFlour']
  }
};

export function getIngredient(id: string): IngredientT | undefined {
  return (catalog as any)[id] as IngredientT | undefined;
}

export function listCatalog() {
  return Object.values(catalog).map(i => ({ id: i.id, name: i.name, roles: i.functionalRoles }));
}

export function suggestSubstitutes(targetId: string, ctx: SubContext = {}) {
  const target = catalog[targetId];
  if (!target) return [] as Array<{id: string; reason: string; dosage?: string}>;

  // If onHand includes target, prefer it
  if (ctx.onHand?.includes(targetId)) {
    return [{ id: targetId, reason: 'On hand', dosage: dosageText(target) }];
  }

  // If role is surfactant and yucca is limited/unavailable, offer quillaja, then soapwort; aloe as adjunct with guardrail
  if (target.functionalRoles.includes('surfactant')) {
    const out: Array<{id: string; reason: string; dosage?: string}> = [];
    if (targetId !== 'quillaja') out.push(annotate('quillaja', 'Functional saponin surfactant; globally more available', ctx));
    if (targetId !== 'soapwort') out.push(annotate('soapwort', 'Traditional saponin source; lower potency but accessible', ctx));
    out.push(annotate('aloe', 'Adjunct surfactant/biostimulant; keep at ~5% v/v to avoid inhibition', ctx));
    return out;
  }

  // If role is biostimulant and aloe is not available, propose accessible biostimulants
  if (target.functionalRoles.includes('biostimulant')) {
    const out: Array<{id: string; reason: string; dosage?: string}> = [];
    if (targetId !== 'seaweed') out.push(annotate('seaweed', 'Hormonal & alginate-rich biostimulant; widely available', ctx));
    if (targetId !== 'humic') out.push(annotate('humic', 'Soil CEC & chelation; pairs well with fulvic', ctx));
    if (targetId !== 'fulvic') out.push(annotate('fulvic', 'Small-molecule chelation; improves uptake', ctx));
    return out;
  }

  // If prebiotic/carbohydrate role is desired, suggest molasses as accessible microbe feed
  if (ctx.desiredRole === 'prebiotic') {
    const out: Array<{id: string; reason: string; dosage?: string}> = [];
    out.push(annotate('pearlMillet', 'Superior dry carbohydrate source for sustained feed', ctx));
    out.push(annotate('oatFlour', 'Dry carbohydrate with beta‑glucans; widely available', ctx));
    out.push(annotate('molasses', 'Accessible liquid carbohydrate; avoid spikes', ctx));
    return out;
  }

  // Fallback to declared substitutes
  return (target.substitutes || []).map((id: string) => ({ id, reason: 'Catalog substitute', dosage: dosageText(catalog[id]) }));
}

function dosageText(ing: IngredientT | undefined) {
  if (!ing) return undefined;
  const d = ing.dosageRange;
  return `${d.min}-${d.max} ${d.unit}${d.default ? ` (typical ${d.default} ${d.unit})` : ''}`;
}

function annotate(id: string, base: string, ctx: SubContext) {
  const ing = (catalog as any)[id] as IngredientT | undefined;
  let reason = base;
  if (ctx.onHand?.includes(id)) reason = `${reason} (on hand)`;
  if (ctx.region && ctx.region !== 'GLOBAL' && ing) {
    const avail = ing.availability;
    const listed = avail.regions?.includes(ctx.region);
    if (!listed && avail.status !== 'common') {
      reason = `${reason} (availability may be limited in ${ctx.region})`;
    }
  }
  return { id, reason, dosage: dosageText(ing) };
}
