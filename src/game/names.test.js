import { formatPlayerName, playerNameKey, toUpperName } from './names';

describe('player names', () => {
  it.each([
    ['João da Silva', 'JOÃO DA SILVA'],
    ['joao da silva', 'JOAO DA SILVA'],
    ['JoÃo Da SiLvA', 'JOÃO DA SILVA'],
    ['  joão   da  silva ', 'JOÃO DA SILVA'],
    ['conceição', 'CONCEIÇÃO'],
  ])('%p is stored and shown as %p', (typed, shown) => {
    expect(formatPlayerName(typed)).toBe(shown);
  });

  it('keeps spaces while typing, so the cursor does not jump', () => {
    expect(toUpperName('joão ')).toBe('JOÃO ');
    expect(toUpperName(' a  b')).toBe(' A  B');
  });

  it('limits the stored name to 40 characters', () => {
    expect(formatPlayerName('a'.repeat(60))).toHaveLength(40);
  });

  it('identifies the same player whatever the case, accents or spacing', () => {
    const keys = ['João da Silva', 'JOÃO DA SILVA', 'joao da silva', '  João  da   Silva '].map(playerNameKey);
    expect(new Set(keys)).toEqual(new Set(['joao da silva']));
    expect(playerNameKey('João da Silva')).not.toBe(playerNameKey('João Silva'));
  });
});
