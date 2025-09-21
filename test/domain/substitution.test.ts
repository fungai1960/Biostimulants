import { describe, expect, it } from 'vitest';
import { suggestSubstitutes } from '../../domain/substitution';

describe('suggestSubstitutes', () => {
  it('provides surfactant alternatives for yucca', () => {
    const subs = suggestSubstitutes('yucca', { region: 'GLOBAL', onHand: [] });
    const ids = subs.map((s) => s.id);
    expect(ids).toContain('quillaja');
    expect(ids).toContain('soapwort');
  });

  it('prioritises on-hand ingredient if available', () => {
    const subs = suggestSubstitutes('yucca', { region: 'GLOBAL', onHand: ['yucca'] });
    expect(subs[0]?.id).toBe('yucca');
    expect(subs[0]?.reason).toMatch(/on hand/i);
  });

  it('returns prebiotic suggestions when role is prebiotic', () => {
    const subs = suggestSubstitutes('molasses', { desiredRole: 'prebiotic', region: 'GLOBAL', onHand: [] });
    const ids = subs.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['pearlMillet', 'oatFlour', 'molasses']));
  });
});
