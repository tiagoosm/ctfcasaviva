// Player names. The rule is the same everywhere: a name is stored and shown in
// capital letters, keeping its accents ("João da Silva" → "JOÃO DA SILVA").
// The server applies the same rule (ctf_start and ctf_admin_update_player), so
// every name that comes from it is already in this form.

export const NAME_MAX_LENGTH = 40;

// While typing: only the letters change, so the cursor and spaces stay put
export const toUpperName = (value) => String(value ?? '').toLocaleUpperCase('pt-BR');

// The name as stored and displayed
export function formatPlayerName(value) {
  return toUpperName(value).replace(/\s+/g, ' ').trim().slice(0, NAME_MAX_LENGTH);
}

// Comparison key used to identify a player: case, accents and extra spaces are
// ignored (mirrors ctf_name_key on the server)
export function playerNameKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
