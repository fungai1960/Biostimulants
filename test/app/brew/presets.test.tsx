import React from "react";
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import BrewPage from '../../../app/brew/page';
import I18nProvider from '../../../app/I18nProvider';

const dbStore = new Map<string, Map<string, any>>();

vi.mock('../../../lib/db', () => {
  const getStore = (name: string) => {
    if (!dbStore.has(name)) {
      dbStore.set(name, new Map());
    }
    return dbStore.get(name)!;
  };

  const openDB = vi.fn(async (name: string) => ({
    async get(id: string) {
      const doc = getStore(name).get(id);
      if (!doc) {
        throw new Error('not_found');
      }
      return doc;
    },
    async put(doc: any) {
      getStore(name).set(doc._id, { ...doc });
      return { ok: true };
    },
    async remove(doc: any) {
      getStore(name).delete(doc._id);
      return { ok: true };
    },
    async allDocs() {
      return {
        rows: Array.from(getStore(name).entries()).map(([id, doc]) => ({ id, doc })),
      } as any;
    },
    async bulkDocs() {
      return [];
    },
  }));

  const getDoc = async (db: any, id: string) => {
    try {
      return await db.get(id);
    } catch (err) {
      return null;
    }
  };

  const upsertDoc = async (db: any, id: string, data: any) => {
    const existing = await getDoc(db, id);
    const doc = { _id: id, ...(existing?._rev ? { _rev: existing._rev } : {}), ...data };
    await db.put(doc);
    return doc;
  };

  const removeDoc = async (db: any, id: string) => {
    try {
      const current = await db.get(id);
      await db.remove(current);
    } catch (err) {
      /* ignore missing docs in tests */
    }
  };

  const listAll = async (db: any) => {
    const docs = await db.allDocs();
    return docs.rows.map((row: any) => row.doc);
  };

  return { openDB, getDoc, upsertDoc, removeDoc, listAll };
});

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('BrewPage presets', () => {
  beforeEach(() => {
    dbStore.clear();
  });

  it('restores saved brew inputs from storage without overwriting carbs on stage change', async () => {
    const savedSettings = new Map<string, any>();
    savedSettings.set('brew', {
      _id: 'brew',
      stage: 'veg',
      volumeLiters: 25,
      aloePercent: 7,
      includeCarbs: true,
      carbsUnit: 'g',
      carbsDoseMlPerL: 4,
      carbsSourceKey: 'millet',
      carbsSource: 'Pearl millet flour',
      yuccaAvailable: true,
      aloeAvailable: false,
    });
    dbStore.set('sba-settings', savedSettings);

    render(
      <I18nProvider>
        <BrewPage />
      </I18nProvider>
    );

    const stageSelect = await screen.findByLabelText(/Crop Stage/i);
    expect((stageSelect as HTMLSelectElement).value).toBe('veg');

    const volumeInput = screen.getByLabelText(/Batch Volume/i) as HTMLInputElement;
    expect(volumeInput.value).toBe('25');

    const carbUnitSelect = screen.getByLabelText(/Carbohydrates unit/i) as HTMLSelectElement;
    const carbDoseInput = screen.getByLabelText(/Carbohydrates dose/i) as HTMLInputElement;
    const includeCarbs = screen.getByRole('checkbox', { name: /Include carbohydrates/i }) as HTMLInputElement;

    expect(carbUnitSelect.value).toBe('g');
    expect(carbDoseInput.value).toBe('4');
    expect(includeCarbs.checked).toBe(true);

    const user = userEvent.setup();
    await user.selectOptions(stageSelect, 'late-flower');

    await waitFor(() => {
      expect((screen.getByLabelText(/Carbohydrates unit/i) as HTMLSelectElement).value).toBe('g');
      expect((screen.getByLabelText(/Carbohydrates dose/i) as HTMLInputElement).value).toBe('4');
    });
  });

  it('saves, reapplies, and protects carbohydrate settings when stage changes', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <BrewPage />
      </I18nProvider>
    );

    const stageSelect = await screen.findByLabelText(/Crop Stage/i);
    await user.selectOptions(stageSelect, 'veg');

    const carbSourceSelect = screen.getByLabelText(/Carbohydrates source/i);
    await user.selectOptions(carbSourceSelect, 'millet');

    const carbUnitSelect = screen.getByLabelText(/Carbohydrates unit/i) as HTMLSelectElement;
    expect(carbUnitSelect.value).toBe('g');

    const carbDoseInput = screen.getByLabelText(/Carbohydrates dose/i) as HTMLInputElement;
    fireEvent.change(carbDoseInput, { target: { value: '4' } });
    expect(carbDoseInput.value).toBe('4');

    const includeCarbs = screen.getByRole('checkbox', { name: /Include carbohydrates/i }) as HTMLInputElement;
    if (!includeCarbs.checked) {
      await user.click(includeCarbs);
    }

    const presetNameInput = screen.getByPlaceholderText(/Name this preset/i);
    await user.type(presetNameInput, 'Proto preset');
    await user.click(screen.getByRole('button', { name: /Save current as preset/i }));

    const presetPill = await screen.findByText('Proto preset');
    await waitFor(() => {
      const store = dbStore.get('sba-settings');
      const saved = store?.get('brew-presets');
      const preset = saved?.items?.find((item: any) => item.name === 'Proto preset');
      expect(preset?.carbsUnit).toBe('g');
      expect(preset?.carbsDoseMlPerL).toBe(4);
      expect(preset?.carbsSourceKey).toBe('millet');
    });

    await user.selectOptions(stageSelect, 'early-flower');
    await user.selectOptions(carbUnitSelect, 'ml');
    fireEvent.change(carbDoseInput, { target: { value: '2' } });
    if (includeCarbs.checked) {
      await user.click(includeCarbs);
    }

    const presetContainer = presetPill.closest('div');
    expect(presetContainer).not.toBeNull();
    const applyButton = within(presetContainer as HTMLElement).getByRole('button', { name: /Apply/i });
    await user.click(applyButton);

    await waitFor(() => {
      expect((stageSelect as HTMLSelectElement).value).toBe('veg');
    });

    await waitFor(() => {
      const store = dbStore.get('sba-settings');
      const brew = store?.get('brew');
      expect(brew?.carbsUnit).toBe('g');
    });

    const unitSelectAfter = screen.getByLabelText(/Carbohydrates unit/i) as HTMLSelectElement;
    const doseInputAfter = screen.getByLabelText(/Carbohydrates dose/i) as HTMLInputElement;
    const includeCarbsAfter = screen.getByRole('checkbox', { name: /Include carbohydrates/i }) as HTMLInputElement;

    await waitFor(() => {
      expect(unitSelectAfter.value).toBe('g');
      expect(doseInputAfter.value).toBe('4');
      expect(includeCarbsAfter.checked).toBe(true);
    });

    await user.selectOptions(stageSelect, 'late-flower');

    const unitSelectFinal = screen.getByLabelText(/Carbohydrates unit/i) as HTMLSelectElement;
    const doseInputFinal = screen.getByLabelText(/Carbohydrates dose/i) as HTMLInputElement;

    await waitFor(() => {
      expect(unitSelectFinal.value).toBe('g');
      expect(doseInputFinal.value).toBe('4');
    });
  });
});
