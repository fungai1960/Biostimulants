"use client";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildStageRecipe } from '../../domain/templates';
import { suggestSubstitutes } from '../../domain/substitution';

function expect(label: string, cond: boolean) {
  return { label, cond };
}

export default function TestsPage() {
  const { t } = useTranslation();
  const [results, setResults] = useState<{label: string; cond: boolean}[] | null>(null);

  const run = () => {
    const out: {label: string; cond: boolean}[] = [];

    // buildStageRecipe basic checks
    const recipe = buildStageRecipe({ stage: 'veg', volumeLiters: 20, aloePercent: 5, yuccaAvailable: false, aloeAvailable: true, onHand: [] });
    out.push(expect('recipe not empty', recipe.length > 0));
    const aloe = recipe.find(r => r.id === 'aloe');
    out.push(expect('aloe present', !!aloe));
    out.push(expect('aloe shows per L and total', aloe ? /per L.*total/.test(aloe.amount) : false));

  // late-flower should include fulvic and molasses
  const late = buildStageRecipe({ stage: 'late-flower', volumeLiters: 20, aloePercent: 5, yuccaAvailable: false, aloeAvailable: true, onHand: [] });
  out.push(expect('late flower has fulvic', late.some(r => r.id === 'fulvic')));
  out.push(expect('late flower has molasses', late.some(r => r.id === 'molasses')));

  // carbsPerL override should be reflected in molasses amount
  const lateCustom = buildStageRecipe({ stage: 'late-flower', volumeLiters: 20, aloePercent: 5, yuccaAvailable: false, aloeAvailable: true, onHand: [], includeCarbs: true, carbsPerL: 3 });
  const mol3 = lateCustom.find(r => r.id === 'molasses');
  out.push(expect('molasses per L shows 3 ml/L', mol3 ? /3\s*ml\s*per\s*L/.test(mol3.amount) : false));
  out.push(expect('molasses total shows 60 ml for 20 L', mol3 ? /\(60\s*ml\s*total\)/.test(mol3.amount) : false));

  // clamping: 7 ml/L request should clamp to 5 ml/L
  const lateClamp = buildStageRecipe({ stage: 'late-flower', volumeLiters: 10, aloePercent: 5, yuccaAvailable: false, aloeAvailable: true, onHand: [], includeCarbs: true, carbsPerL: 7 });
  const molClamp = lateClamp.find(r => r.id === 'molasses');
  out.push(expect('molasses per L clamps to 5 ml/L', molClamp ? /5\s*ml\s*per\s*L/.test(molClamp.amount) : false));
  out.push(expect('molasses total clamps to 50 ml for 10 L', molClamp ? /\(50\s*ml\s*total\)/.test(molClamp.amount) : false));

    // suggestSubstitutes provides surfactant alternatives
    const subs = suggestSubstitutes('yucca', { region: 'GLOBAL', onHand: [] });
    out.push(expect('has quillaja alt', subs.some(s => s.id === 'quillaja')));
    out.push(expect('has soapwort alt', subs.some(s => s.id === 'soapwort')));

    // on-hand annotation should favor target
    const subsOnHand = suggestSubstitutes('yucca', { region: 'GLOBAL', onHand: ['yucca'] });
    out.push(expect('on hand returns target first', subsOnHand.length > 0 && subsOnHand[0].id === 'yucca'));

  // prebiotic suggestions include molasses
  const prebio = suggestSubstitutes('aloe', { region: 'GLOBAL', onHand: [], desiredRole: 'prebiotic' });
  out.push(expect('prebiotic suggests molasses', prebio.some(s => s.id === 'molasses')));

    setResults(out);
  };

  const passCount = results?.filter(r => r.cond).length ?? 0;
  const failCount = results ? results.length - passCount : 0;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{t('tests.title')}</h1>
      <button onClick={run} className="px-3 py-2 border rounded text-sm">{t('tests.run')}</button>
      {results && (
        <div>
          <p className="text-sm mt-2">{passCount} {t('tests.pass')}, {failCount} {t('tests.fail')}</p>
          <ul className="list-disc ml-5 mt-2 text-sm">
            {results.map((r, i) => (
              <li key={i} className={r.cond ? 'text-green-700' : 'text-red-700'}>
                {r.cond ? '✔ ' : '✖ '} {r.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
