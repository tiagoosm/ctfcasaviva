export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const mod = (n, m) => ((n % m) + m) % m;

export function shiftLetter(letter, shift) {
  const upper = letter.toUpperCase();
  const index = ALPHABET.indexOf(upper);
  if (index === -1) return letter;
  const shifted = ALPHABET[mod(index + shift, 26)];
  return letter === upper ? shifted : shifted.toLowerCase();
}

export function caesar(text, shift) {
  return Array.from(text, (char) => shiftLetter(char, shift)).join('');
}

export function letterToShift(letter) {
  return ALPHABET.indexOf(letter.toUpperCase());
}

// Cifra de Vigenère: cada letra usa o deslocamento da letra correspondente da chave
export function vigenere(text, key, direction = 1) {
  const shifts = Array.from(key, letterToShift);
  let position = 0;
  return Array.from(text, (char) => {
    if (!ALPHABET.includes(char.toUpperCase())) return char;
    const shift = shifts[position % shifts.length] * direction;
    position += 1;
    return shiftLetter(char, shift);
  }).join('');
}
