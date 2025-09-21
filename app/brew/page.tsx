"use client";
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { suggestSubstitutes } from '../../domain/substitution';
import { buildStageRecipe, stageCarbDefaults } from '../../domain/templates';
import { openDB, getDoc, upsertDoc } from '../../lib/db';
import { listCatalog } from '../../domain/substitution';
import OnHandChips from '../../components/OnHandChips';

type IngredientInput = {
  yuccaAvailable: boolean;
  aloeAvailable: boolean;
  aloePercent: number; // % v/v
  volumeLiters: number;
  stage: 'seedling' | 'veg' | 'early-flower' | 'late-flower';
  region?: string; // optional override; defaults to GLOBAL when empty
  includeCarbs?: boolean;
  carbsDoseMlPerL?: number;
  carbsSource?: string;
  carbsUnit?: 'ml' | 'g';
  carbsSourceKey?: 'millet' | 'oat' | 'molasses' | 'other';
};

const lateStageCarb = stageCarbDefaults['late-flower'];

const DEFAULTS: IngredientInput = {
  yuccaAvailable: false,
  aloeAvailable: true,
  aloePercent: 5,
  volumeLiters: 20,
  stage: 'late-flower',
  includeCarbs: true,
  carbsDoseMlPerL: lateStageCarb.dose,
  carbsSource: lateStageCarb.sourceLabel,
  carbsUnit: lateStageCarb.unit,
  carbsSourceKey: lateStageCarb.sourceKey,
};

import Link from 'next/link';

export default function BrewPage() {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState<IngredientInput>(DEFAULTS);
  const [carbTouched, setCarbTouched] = useState(false);
  const markCarbTouched = () => setCarbTouched(true);
  // avoid writing defaults before we load existing saved inputs
  const [loaded, setLoaded] = useState<boolean>(false);
  const [inventory, setInventory] = useState<string[]>([]);
  const isDryCarb = useMemo(() => inputs.carbsUnit === 'g', [inputs.carbsUnit]);
  const carbUnit = isDryCarb ? 'g' : 'ml';
  const carbMin = isDryCarb ? 2 : 1;
  const carbMax = isDryCarb ? 10 : 5;
  // Client-only timestamp for print header to avoid SSR hydration mismatch
  const [printedAt, setPrintedAt] = useState<string>('');
  useEffect(() => {
    setPrintedAt(new Date().toLocaleString());
  }, []);
  const catalogMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; roles: string[] }>();
    try {
      listCatalog().forEach(i => map.set(i.id, i as any));
    } catch (err) { console.error('Failed to build catalog map', err); }
    return map;
  }, []);
  const allCatalog = useMemo(() => {
    try { return listCatalog(); } catch { return []; }
  }, []);
  const [invEditorOpen, setInvEditorOpen] = useState(false);
  const [invDraft, setInvDraft] = useState<string[]>([]);
  const [invFilter, setInvFilter] = useState('');
  // Presets
  type BrewPreset = IngredientInput & { name: string; id: string };
  const [presets, setPresets] = useState<BrewPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = await openDB('sba-settings');
        const doc = await getDoc<any>(db, 'brew-presets');
        if (mounted && Array.isArray(doc?.items)) setPresets(doc.items);
      } catch (err) { console.error('Failed to load brew presets', err); }
    })();
    return () => { mounted = false; };
  }, []);
  const persistPresets = async (items: BrewPreset[]) => {
    try {
      const db = await openDB('sba-settings');
      await upsertDoc(db, 'brew-presets', { items });
    } catch (err) {
      console.error('Failed to persist brew presets', err);
    }
  };
  // Load/save inputs via PouchDB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = await openDB('sba-settings');
        const doc = await getDoc<any>(db, 'brew');
        if (mounted) {
          setCarbTouched(!!doc);
          if (doc) {
            const next: IngredientInput = { ...DEFAULTS, ...doc } as any;
            // Migrate unit and source key if missing
            if (!next.carbsUnit) {
              const s = (next.carbsSource || '').toLowerCase();
              next.carbsUnit = (s.includes('millet') || s.includes('oat')) ? 'g' : 'ml';
            }
            if (!next.carbsSourceKey) {
              const s = (next.carbsSource || '').toLowerCase();
              next.carbsSourceKey = s.includes('millet') ? 'millet' : s.includes('oat') ? 'oat' : s.includes('molasses') ? 'molasses' : 'other';
            }
            setInputs(prev => ({ ...prev, ...next }));
          }
          setLoaded(true);
        }
      } catch (err) { console.error('Failed to load saved brew inputs', err); }
    })();
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!loaded) return; // don't write defaults before initial load
    (async () => {
      try {
        const db = await openDB('sba-settings');
        await upsertDoc(db, 'brew', inputs as any);
      } catch (err) { console.error('Failed to persist brew inputs', err); }
    })();
  }, [inputs, loaded]);

  // Load on-hand inventory ids
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = await openDB('sba-settings');
        const doc = await getDoc<any>(db, 'inventory');
        if (mounted) setInventory(Array.isArray(doc?.ids) ? doc.ids : []);
      } catch { setInventory([]); }
    })();
    return () => { mounted = false; };
  }, []);

  const aloeMl = useMemo(() => (inputs.volumeLiters * 1000 * (inputs.aloePercent / 100)), [inputs]);

  const surfactantAdvice = useMemo(() => {
    if (inputs.yuccaAvailable) {
      return {
        primary: t('brew.yuccaAvailable', 'Yucca is available. Typical dose: 0.05–0.1 ml/L as a wetting agent.'),
        options: [] as string[]
      };
    }
    // Pull on-hand from inventory doc
    const onHand = inventory;
    const region = (inputs.region && inputs.region.trim()) ? inputs.region.trim().toUpperCase() : 'GLOBAL';
    const suggestions = suggestSubstitutes('yucca', { desiredRole: 'surfactant', region, onHand })
      .map((s: { id: string; reason: string; dosage?: string }) => `${s.id}: ${s.reason}${s.dosage ? ` — ${s.dosage}` : ''}`);
    return {
      primary: t('brew.yuccaNotAvailable', 'Yucca not available. Suggesting functional alternatives:'),
      options: suggestions
    };
  }, [inputs.yuccaAvailable, inventory, inputs.region, t]);

  const aloeAdvice = useMemo(() => {
    if (inputs.aloeAvailable) {
      return {
        primary: t('brew.aloeDefault', 'Aloe selected by default for microbe-friendly brews (~5% v/v).'),
        options: [] as string[]
      };
    }
    const suggestions = [
      ...[ { id: 'seaweed', reason: 'Widely available hormonal/alginate biostimulant' } ],
      ...[ { id: 'humic', reason: 'Soil CEC/chelation; pairs with fulvic' } ],
      ...[ { id: 'fulvic', reason: 'Small-molecule chelation; improves nutrient uptake' } ],
      ...[ { id: 'comfrey', reason: 'Grow-your-own leafy tonic; potassium-rich' } ],
    ].map(s => `${s.id}: ${s.reason}`);
    return {
      primary: t('brew.aloeNotAvailable', 'Aloe not available. Consider these accessible biostimulants:'),
      options: suggestions
    };
  }, [inputs.aloeAvailable, t]);

  const aloeWarning = inputs.aloePercent > 25
    ? t('brew.aloeWarnHigh', 'Warning: >25% v/v may inhibit microbes. Reduce to ~5% for Lactobacillus-friendly brews.')
    : inputs.aloePercent > 10
      ? t('brew.aloeCaution', 'Caution: Consider reducing aloe to around 5% v/v for microbe-friendly conditions.')
      : t('brew.aloeOk', 'Aloe at ~5% v/v supports Lactobacillus and adds hormones/saponins.');

  const handleNumber = (key: keyof IngredientInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setInputs(prev => ({ ...prev, [key]: Number.isFinite(v) ? v : prev[key] }));
  };

  const handleStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStage = e.target.value as IngredientInput['stage'];
    setInputs((prev) => {
      let updated = { ...prev, stage: nextStage };
      if (!carbTouched && prev.includeCarbs !== false) {
        const defaults = stageCarbDefaults[nextStage];
        if (defaults) {
          updated = {
            ...updated,
            carbsUnit: defaults.unit,
            carbsDoseMlPerL: defaults.dose,
            carbsSourceKey: defaults.sourceKey,
            carbsSource: defaults.sourceLabel
          };
        }
      }
      return updated;
    });
  };

  // Stage-aware hinting
  const stageHint = useMemo(() => {
    switch (inputs.stage) {
      case 'seedling': return t('brew.hintSeedling');
      case 'veg': return t('brew.hintVeg');
      case 'early-flower': return t('brew.hintEarly');
      case 'late-flower': return t('brew.hintLate');
    }
  }, [inputs.stage, t]);

  const protozoa = t('brew.protozoa', { returnObjects: true }) as {
    title: string;
    intro: string;
    standardHeading: string;
    standardItems: string[];
    bulkHeading: string;
    bulkItems: string[];
    keyHeading: string;
    keyItems: string[];
  };

  // 24h brew timer
  const [startTs, setStartTs] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = await openDB('sba-settings');
        const doc = await getDoc<any>(db, 'brew-timer');
        if (mounted) setStartTs(doc?.ts ?? null);
      } catch (err) {
        console.error('Failed to load brew timer', err);
      }
    })();
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const db = await openDB('sba-settings');
        if (startTs) await upsertDoc(db, 'brew-timer', { ts: startTs });
        else await upsertDoc(db, 'brew-timer', { ts: null });
      } catch (err) {
        console.error('Failed to persist brew timer', err);
      }
    })();
  }, [startTs]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsedMs = startTs ? Math.max(0, now - startTs) : 0;
  const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsedMs);
  const formatHMS = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  };

  const templateItems = useMemo(() => buildStageRecipe({
    stage: inputs.stage,
    volumeLiters: inputs.volumeLiters,
    aloePercent: inputs.aloePercent,
    yuccaAvailable: inputs.yuccaAvailable,
    aloeAvailable: inputs.aloeAvailable,
    onHand: inventory,
    includeCarbs: inputs.includeCarbs !== false,
    carbsPerL: inputs.carbsDoseMlPerL,
    carbsSource: inputs.carbsSource,
    carbsUnit: inputs.carbsUnit
  }), [inputs.stage, inputs.volumeLiters, inputs.aloePercent, inputs.yuccaAvailable, inputs.aloeAvailable, inputs.includeCarbs, inputs.carbsDoseMlPerL, inputs.carbsSource, inputs.carbsUnit, inventory]);

  const exportRecipeCsv = () => {
    const header = ['id','name','amount','note'];
    const rows = templateItems.map(it => [it.id, it.name, it.amount, it.note ?? '']);
    const csv = [header.join(','), ...rows.map(r => r.map(v => JSON.stringify(v ?? '')).join(','))].join('
');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `brew-recipe-${inputs.stage}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyRecipeText = async () => {
    const lines = templateItems.map(it => `${it.name}: ${it.amount}${it.note ? ` — ${it.note}` : ''}`);
    const text = `Stage: ${inputs.stage}
Volume: ${inputs.volumeLiters} L
Aloe: ${inputs.aloePercent}% v/v

` + lines.join('
');
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };
  const [copyStatus, setCopyStatus] = useState<string>('');
  const saveDraftLog = async () => {
    try {
      const db = await openDB('sba-logs');
      const text = templateItems.map(it => `${it.name}: ${it.amount}${it.note ? ` — ${it.note}` : ''}`).join('
');
      const draft = {
        id: 'draft-log',
        date: new Date().toISOString().slice(0,10),
        plot: '',
  batchNote: `Brew ${inputs.stage}, ${inputs.volumeLiters} L${inputs.includeCarbs !== false ? `, carbs ${inputs.carbsSource || 'Molasses'} @ ${inputs.carbsDoseMlPerL ?? (isDryCarb ? 5 : 2)} ${carbUnit}/L` : ''}` ,
        applicationRate: '',
        outcomes: text
      } as any;
      await upsertDoc(db, 'draft-log', draft);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-1">{t('brew.header')}</h1>
        <p className="text-sm text-gray-600">{t('brew.subheader')}</p>
      </header>

      <section className="p-4 bg-white rounded-md shadow border space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">{t('brew.onHandTitle')}</p>
          <OnHandChips ids={inventory} catalog={catalogMap} emptyText={t('brew.onHandEmpty')} />
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
            <Link href="/inventory" className="text-green-700 hover:underline">{t('brew.manageInventory')}</Link>
            <button onClick={() => { setInvDraft(inventory); setInvFilter(''); setInvEditorOpen(true); }} className="px-2 py-1 border rounded text-green-700 border-green-300 hover:bg-green-50" aria-label={t('brew.editInventory')}>
              {t('brew.editInventory')}
            </button>
          </div>
        </div>
        <details className="mt-2 print:hidden">
          <summary className="cursor-pointer text-sm text-gray-700">{t('common.advanced')}</summary>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('brew.regionLabel')}</label>
              <input value={inputs.region || ''} onChange={(e) => setInputs(p => ({ ...p, region: e.target.value }))}
                     className="w-full border rounded px-3 py-2" placeholder={t('brew.regionPlaceholder') as string} />
              <p className="text-xs text-gray-600 mt-1">{t('common.globalDefaultHint')}</p>
            </div>
          </div>
        </details>
        <div>
          <label className="block text-sm font-medium mb-1">{t('brew.stage')}</label>
          <select value={inputs.stage} onChange={handleStage} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={t('brew.stage')}>
            <option value="seedling">{t('brew.seedling')}</option>
            <option value="veg">{t('brew.veg')}</option>
            <option value="early-flower">{t('brew.early')}</option>
            <option value="late-flower">{t('brew.late')}</option>
          </select>
          <p className="text-xs text-gray-600 mt-1">{stageHint}</p>
        </div>
        <div>
     <label className="block text-sm font-medium mb-1">{t('brew.volume')}</label>
     <input type="number" min={1} step={1} value={inputs.volumeLiters} onChange={handleNumber('volumeLiters')}
       className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={t('brew.volume')} />
     <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-700">
       <span className="text-gray-600">{t('brew.volumePresets')}:</span>
      {[10,20,50].map(v => (
        <button key={v} onClick={() => setInputs(p => ({ ...p, volumeLiters: v }))}
                className={`px-2 py-1 border rounded ${inputs.volumeLiters===v? 'bg-green-600 text-white border-green-700':'bg-white'}`}
                aria-pressed={inputs.volumeLiters===v}
        >{v} L</button>
      ))}
     </div>
        </div>

        <div className="flex items-center gap-3">
     <input id="yuccaAvail" type="checkbox" checked={inputs.yuccaAvailable}
       onChange={(e) => setInputs(p => ({ ...p, yuccaAvailable: e.target.checked }))}
       aria-checked={inputs.yuccaAvailable} aria-label={t('brew.yuccaAvail')} />
     <label htmlFor="yuccaAvail" className="text-sm select-none">{t('brew.yuccaAvail')}</label>
        </div>

        <div className="flex items-center gap-3">
     <input id="aloeAvail" type="checkbox" checked={inputs.aloeAvailable}
       onChange={(e) => setInputs(p => ({ ...p, aloeAvailable: e.target.checked }))}
       aria-checked={inputs.aloeAvailable} aria-label={t('brew.aloeAvail')} />
     <label htmlFor="aloeAvail" className="text-sm select-none">{t('brew.aloeAvail')}</label>
        </div>

        <div className="flex items-center gap-3">
      <input id="includeCarbs" type="checkbox" checked={inputs.includeCarbs !== false}
        onChange={(e) => {
          const checked = e.target.checked;
          setInputs((prev) => {
            let updated = { ...prev, includeCarbs: checked };
            if (checked && !carbTouched) {
              const defaults = stageCarbDefaults[prev.stage];
              if (defaults) {
                updated = {
                  ...updated,
                  carbsUnit: defaults.unit,
                  carbsDoseMlPerL: defaults.dose,
                  carbsSourceKey: defaults.sourceKey,
                  carbsSource: defaults.sourceLabel
                };
              }
            }
            return updated;
          });
          if (!checked) setCarbTouched(true);
        }}
        aria-checked={inputs.includeCarbs !== false} aria-label={t('brew.includeCarbs')} />
     <label htmlFor="includeCarbs" className="text-sm select-none">{t('brew.includeCarbs')}</label>
        </div>
        {inputs.includeCarbs !== false && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="carbSourceSelect">{t('brew.carbsSourceSelect')}</label>
            <select id="carbSourceSelect" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                    value={inputs.carbsSourceKey || 'molasses'}
                    onChange={(e) => {
                      markCarbTouched();
                      const key = e.target.value as any;
                      let label = inputs.carbsSource || '';
                      let unit: 'ml'|'g' = inputs.carbsUnit || 'ml';
                      if (key === 'millet') { label = t('brew.sourceMillet') as string; unit = 'g'; }
                      if (key === 'oat') { label = t('brew.sourceOat') as string; unit = 'g'; }
                      if (key === 'molasses') { label = t('brew.sourceMolasses') as string; unit = 'ml'; }
                      if (key === 'other') { label = ''; unit = 'g'; }
                      const min = unit==='g'?2:1; const max = unit==='g'?10:5; const fallback = unit==='g'?5:2;
                      const nextDose = Math.min(max, Math.max(min, inputs.carbsDoseMlPerL ?? fallback));
                      setInputs(p => ({ ...p, carbsSourceKey: key, carbsSource: label, carbsUnit: unit, carbsDoseMlPerL: nextDose }));
                    }}>
              <option value="millet">{t('brew.sourceMillet')}</option>
              <option value="oat">{t('brew.sourceOat')}</option>
              <option value="molasses">{t('brew.sourceMolasses')}</option>
              <option value="other">{t('brew.sourceOther')}</option>
            </select>
            {inputs.carbsSourceKey === 'other' && (
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1" htmlFor="carbsSourceOther">{t('brew.carbsSourceOtherLabel')}</label>
                <input id="carbsSourceOther" value={inputs.carbsSource || ''} onChange={(e) => { markCarbTouched(); setInputs(p => ({ ...p, carbsSource: e.target.value })); }}
                       placeholder={t('brew.carbsSourceOtherPlaceholder') as string}
                       className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            )}
            <label className="block text-sm font-medium mb-1" htmlFor="carbUnitSelect">{t('brew.carbsUnit')}</label>
            <select id="carbUnitSelect" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                    value={inputs.carbsUnit || 'ml'}
                    onChange={(e) => {
                      markCarbTouched();
                      const unit = e.target.value as 'ml'|'g';
                      const min = unit==='g'?2:1; const max = unit==='g'?10:5; const fallback = unit==='g'?5:2;
                      const nextDose = Math.min(max, Math.max(min, inputs.carbsDoseMlPerL ?? fallback));
                      setInputs(p => ({ ...p, carbsUnit: unit, carbsDoseMlPerL: nextDose }));
                    }}>
              <option value="ml">{t('brew.unitLiquid')}</option>
              <option value="g">{t('brew.unitDry')}</option>
            </select>
            <label className="block text-sm font-medium mb-1" htmlFor="carbsDoseInput">{t('brew.carbsDose')} ({carbUnit}/L)</label>
            <input id="carbsDoseInput" type="number" min={carbMin} max={carbMax} step={isDryCarb ? 1 : 0.5} value={inputs.carbsDoseMlPerL ?? (isDryCarb ? 5 : 2)}
                   onChange={(e) => {
                     markCarbTouched();
                     const raw = Number(e.target.value);
                     const fallback = isDryCarb ? 5 : 2;
                     const clamped = Math.min(carbMax, Math.max(carbMin, isNaN(raw) ? fallback : raw));
                     setInputs(p => ({ ...p, carbsDoseMlPerL: clamped }));
                   }}
                   onBlur={(e) => {
                     markCarbTouched();
                     const raw = Number(e.target.value);
                     const fallback = isDryCarb ? 5 : 2;
                     const clamped = Math.min(carbMax, Math.max(carbMin, isNaN(raw) ? fallback : raw));
                     if (clamped !== (inputs.carbsDoseMlPerL ?? fallback)) setInputs(p => ({ ...p, carbsDoseMlPerL: clamped }));
                   }}
                   aria-describedby="carbsDoseHint"
                   className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p id="carbsDoseHint" className="text-xs text-gray-600 mt-1">{t('brew.carbsHint')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-700">
              <span className="text-gray-600">{t('brew.carbsDosePresets')}:</span>
              {(isDryCarb ? [2,5,10] : [0.5,1,2,3,5]).map(v => (
                <button key={v} onClick={() => { markCarbTouched(); setInputs(p => ({ ...p, carbsDoseMlPerL: Math.min(carbMax, Math.max(carbMin, v)) })) }}
                        className={`px-2 py-1 border rounded ${inputs.carbsDoseMlPerL===v? 'bg-green-600 text-white border-green-700':'bg-white'}`}
                        aria-pressed={inputs.carbsDoseMlPerL===v}
                >{v} {carbUnit}/L</button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t('brew.aloePct')}</label>
     <input type="number" min={0} max={100} step={0.5} value={inputs.aloePercent} onChange={handleNumber('aloePercent')}
       className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={t('brew.aloePct')} />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-700">
            <span className="text-gray-600">{t('brew.aloePresets')}:</span>
            {[2.5,5,10].map(v => (
              <button key={v} onClick={() => setInputs(p => ({ ...p, aloePercent: v }))}
                      className={`px-2 py-1 border rounded ${inputs.aloePercent===v? 'bg-green-600 text-white border-green-700':'bg-white'}`}
                      aria-pressed={inputs.aloePercent===v}
              >{v}%</button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1">{t('brew.calcAloe')}: <span className="font-medium">{aloeMl.toFixed(0)} ml</span></p>
          <p className={"text-xs mt-1 " + (inputs.aloePercent > 25 ? 'text-red-600' : 'text-amber-700')}>{aloeWarning}</p>
        </div>
      </section>

      <section className="p-4 bg-white rounded-md shadow border print:hidden">
        <h2 className="font-medium mb-2">{t('brew.presetsTitle')}</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {presets.length === 0 && (
            <p className="text-sm text-gray-600">{t('brew.savePreset')}</p>
          )}
          {presets.map(p => (
            <div key={p.id} className="flex items-center gap-2 border rounded px-2 py-1 text-sm">
              <span className="font-medium">{p.name}</span>
              <button onClick={() => setInputs({
                yuccaAvailable: p.yuccaAvailable,
                aloeAvailable: p.aloeAvailable,
                aloePercent: p.aloePercent,
                volumeLiters: p.volumeLiters,
                stage: p.stage,
                region: p.region
              })} className="px-2 py-0.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.apply')}</button>
              <button onClick={() => { if (!(window.confirm(t('brew.deleteConfirm', { name: p.name }) as string))) return; const next = presets.filter(x => x.id !== p.id); setPresets(next); persistPresets(next); }} className="px-2 py-0.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-red-700 border-red-300">{t('brew.delete')}</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={presetName} onChange={(e) => setPresetName(e.target.value)} className="border rounded px-3 py-2 text-sm flex-1" placeholder={t('brew.presetNamePlaceholder') as string} />
          <button onClick={async () => {
            const name = presetName.trim();
            if (!name) return;
            const p: BrewPreset = { id: crypto.randomUUID(), name, ...inputs };
            const next = [p, ...presets];
            setPresets(next);
            setPresetName('');
            await persistPresets(next);
          }} className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.savePreset')}</button>
        </div>
      </section>

      {invEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="invEditorTitle" onKeyDown={(e) => { if (e.key === 'Escape') setInvEditorOpen(false); }}>
          <div className="bg-white rounded-md shadow-lg w-full max-w-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <h3 id="invEditorTitle" className="font-medium text-sm">{t('brew.editInventory')}</h3>
              <button onClick={() => setInvEditorOpen(false)} className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={t('brew.cancel')}>
                {t('brew.cancel')}
              </button>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1" htmlFor="invFilter">{t('brew.search')}</label>
              <input id="invFilter" value={invFilter} onChange={(e) => setInvFilter(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder={t('brew.searchPlaceholder') as string} />
            </div>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-auto" aria-label={t('brew.editInventory')}>
              {allCatalog.filter(i => i.name.toLowerCase().includes(invFilter.toLowerCase()) || i.id.toLowerCase().includes(invFilter.toLowerCase())).map(i => {
                const active = invDraft.includes(i.id);
                return (
                  <button key={i.id}
                          onClick={() => setInvDraft(prev => prev.includes(i.id) ? prev.filter(x => x !== i.id) : [...prev, i.id])}
                          className={`px-3 py-1 rounded border text-xs ${active ? 'bg-green-600 text-white border-green-700' : 'bg-white'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                          aria-pressed={active}
                          aria-label={i.name}>
                    {i.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setInvEditorOpen(false)} className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.cancel')}</button>
              <button onClick={async () => {
                try {
                  const db = await openDB('sba-settings');
                  await upsertDoc(db, 'inventory', { ids: invDraft });
                  setInventory(invDraft);
                } catch (err) {
                  console.error('Failed to update inventory', err);
                }
                setInvEditorOpen(false);
              }} className="px-3 py-2 border rounded text-sm bg-green-600 text-white border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.save')}</button>
            </div>
          </div>
        </div>
      )}

      <section className="p-4 bg-white rounded-md shadow border">
        <h2 className="font-medium mb-2">{t('brew.stageRec')}</h2>
        <p className="text-sm text-gray-700">{stageHint}</p>
        <ul className="list-disc ml-5 space-y-1 text-xs mt-2 text-gray-700">
          {inputs.stage === 'late-flower' && <li>{t('brew.bulletLate')}</li>}
          {inputs.stage === 'seedling' && <li>{t('brew.bulletSeedling')}</li>}
          {inputs.stage === 'veg' && <li>{t('brew.bulletVeg')}</li>}
          {inputs.stage === 'early-flower' && <li>{t('brew.bulletEarly')}</li>}
        </ul>
        <div className="mt-3">
          <h3 className="font-medium text-sm mb-1">{t('brew.stageTemplateTitle')}</h3>
          <div className="flex items-center flex-wrap gap-2 mb-2 print:hidden">
            <button onClick={exportRecipeCsv} className="px-3 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.exportRecipeCsv')}</button>
            <button onClick={async () => { const ok = await copyRecipeText(); setCopyStatus(ok ? 'copied' : 'failed'); setTimeout(() => setCopyStatus(''), 1500); }} className="px-3 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.copyRecipe')}</button>
            <button onClick={async () => {
              const lines = templateItems.map(it => `${it.name}: ${it.amount}${it.note ? ` — ${it.note}` : ''}`).join('
');
              const text = `Stage: ${inputs.stage}
Volume: ${inputs.volumeLiters} L
Aloe: ${inputs.aloePercent}% v/v

${lines}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: t('brew.printTitle') as string, text });
                  setCopyStatus('shared');
                  } catch (err) {
                    console.error('Failed to share brew recipe', err);
                  }
              } else {
                const ok = await copyRecipeText();
                setCopyStatus(ok ? 'copied' : 'failed');
              }
              setTimeout(() => setCopyStatus(''), 1500);
            }} className="px-3 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.shareRecipe')}</button>
            <button onClick={() => window.print()} className="px-3 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.printRecipe')}</button>
            <Link href="/logs" onClick={async (e) => { const ok = await saveDraftLog(); if (!ok) e.preventDefault(); }} className="px-3 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.logThisBrew')}</Link>
            <span className="text-xs text-gray-600" aria-live="polite">{copyStatus === 'copied' ? t('common.copied') : copyStatus === 'failed' ? t('common.copyFailed') : ''}</span>
          </div>
          {/* Print header */}
          <div className="hidden print:block mb-2">
            <div className="text-sm">
              <div><span className="font-medium">Stage:</span> {inputs.stage}</div>
              <div><span className="font-medium">Volume:</span> {inputs.volumeLiters} L</div>
              <div><span className="font-medium">Aloe:</span> {inputs.aloePercent}% v/v</div>
              <div><span className="font-medium">{inputs.includeCarbs !== false ? t('brew.carbsIncluded') : t('brew.carbsExcluded')}</span></div>
              {inputs.includeCarbs !== false && (
                <>
                  <div><span className="font-medium">{t('brew.carbsSourcePrint')}:</span> {inputs.carbsSource || 'Molasses'}</div>
                  <div><span className="font-medium">{t('brew.carbsDosePrint')}:</span> {inputs.carbsDoseMlPerL ?? (isDryCarb ? 5 : 2)} {carbUnit}/L</div>
                </>
              )}
              <div className="text-xs text-gray-600 mt-1">{t('common.printedOn')}: <span suppressHydrationWarning>{printedAt}</span></div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2 print:hidden">{t('brew.carbsHint')}</p>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {templateItems.map((it, i) => (
              <li key={i}><span className="font-medium">{it.name}</span>: {it.amount}{it.note ? ` — ${it.note}` : ''}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="p-4 bg-white rounded-md shadow border print:hidden" aria-live="polite">
        <h2 className="font-medium mb-2">{t('brew.timer')}</h2>
        {startTs ? (
          <div className="text-sm">
            <p>Elapsed: <span className="font-mono">{formatHMS(elapsedMs)}</span></p>
            <p>Remaining to 24h: <span className="font-mono">{formatHMS(remainingMs)}</span></p>
            <button onClick={() => setStartTs(null)} className="mt-2 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.reset')}</button>
          </div>
        ) : (
          <button onClick={() => setStartTs(Date.now())} className="text-sm px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">{t('brew.start24h')}</button>
        )}
        <p className="text-xs text-gray-600 mt-2">{t('brew.aactGuidance')}</p>
      </section>

      <section className="p-4 bg-white rounded-md shadow border print:hidden">
        <h2 className="font-medium mb-2">{t('brew.surfAdvice')}</h2>
        <p className="text-sm mb-2">{surfactantAdvice.primary}</p>
        <ul className="list-disc ml-5 space-y-1 text-sm">
          {surfactantAdvice.options.map((o: string, i: number) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </section>

      <section className="p-4 bg-white rounded-md shadow border print:hidden">
        <h2 className="font-medium mb-2">{t('brew.bioAdvice')}</h2>
        <p className="text-sm mb-2">{aloeAdvice.primary}</p>
        <ul className="list-disc ml-5 space-y-1 text-sm">
          {aloeAdvice.options.map((o: string, i: number) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </section>

      <section className="p-4 bg-white rounded-md shadow border print:hidden">
        <h2 className="font-medium mb-2">{protozoa.title}</h2>
        <p className="text-sm text-gray-700 mb-3">{protozoa.intro}</p>
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <h3 className="font-medium text-sm mb-1">{protozoa.standardHeading}</h3>
            <ul className="list-disc ml-5 space-y-1">
              {protozoa.standardItems.map((item, idx) => (
                <li key={`proto-std-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-1">{protozoa.bulkHeading}</h3>
            <ul className="list-disc ml-5 space-y-1">
              {protozoa.bulkItems.map((item, idx) => (
                <li key={`proto-bulk-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="font-medium text-sm mb-1">{protozoa.keyHeading}</h3>
          <ul className="list-disc ml-5 space-y-1 text-xs text-gray-700">
            {protozoa.keyItems.map((item, idx) => (
              <li key={`proto-key-${idx}`}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="p-4 bg-white rounded-md shadow border print:hidden">
        <h2 className="font-medium mb-1">{t('brew.optionalGrow')}</h2>
        <p className="text-sm text-gray-700">{t('brew.comfreyPara')}</p>
        <ul className="list-disc ml-5 space-y-1 text-xs text-gray-700 mt-2">
          <li>{t('brew.comfreyBullet1')}</li>
          <li>{t('brew.comfreyBullet2')}</li>
          <li>{t('brew.comfreyBullet3')}</li>
        </ul>
      </section>

      <footer className="text-xs text-gray-500 print:hidden">
        {t('brew.footerNote')}
      </footer>
    </main>
  );
}

// inline OnHandChips removed in favor of shared component


