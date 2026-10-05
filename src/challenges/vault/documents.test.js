import { DOCUMENTS } from './documents';

const [records, linguistic, mission] = DOCUMENTS;
const textOf = (document) => JSON.stringify(document);
const decode = (groups) => groups.map((bits) => String.fromCharCode(parseInt(bits, 2))).join('');

describe('investigation room documents', () => {
  it('has the two distractions first and the mission record last', () => {
    expect(DOCUMENTS.map((document) => document.code)).toEqual(['DOC-01', 'DOC-02', 'DOC-03']);
    expect(mission.signal).toBeDefined();
    expect(records.signal).toBeUndefined();
    expect(linguistic.signal).toBeUndefined();
  });

  it('hides a Welsh word in eight 8-bit ASCII groups', () => {
    expect(mission.signal).toHaveLength(8);
    mission.signal.forEach((group) => expect(group).toMatch(/^[01]{8}$/));
    expect(decode(mission.signal)).toBe('BLWYDDYN');
  });

  it('only hints at the mission, without naming it or its year', () => {
    expect(mission.facts).toContainEqual(['MISSÃO', '11']);
    expect(mission.facts).toContainEqual(['DESTINO', 'LUA']);
    expect(mission.quote).toMatch(/UM PEQUENO PASSO/);
  });

  it.each(DOCUMENTS.map((document) => [document.code, document]))(
    '%s never states the answer or the decoded word',
    (code, document) => {
      const text = textOf(document);
      expect(text).not.toMatch(/1969|apollo|apolo|armstrong|primeiro homem|blwyddyn|senha/i);
      // "ano" as a word would give the translation away ("humanos" is fine)
      expect(text).not.toMatch(/\bano\b/i);
    },
  );

  it('keeps the distractions free of any route to the combination', () => {
    // No run of digits in the distraction documents contains 1969, so they
    // cannot produce a second valid answer
    const digits = [records, linguistic].map((document) => textOf(document).replace(/\D/g, '')).join('');
    expect(digits).not.toContain('1969');
    // The Welsh record gives context only: the word in the signal is not there
    expect(linguistic.words).not.toContain('BLWYDDYN');
  });
});
