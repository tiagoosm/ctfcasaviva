// Classes a player can belong to. The server enforces the same list
// (ctf_valid_class in supabase/migrations), so keep the two in sync.
export const GROUPS = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];

export const isValidGroup = (value) => GROUPS.includes(value);
