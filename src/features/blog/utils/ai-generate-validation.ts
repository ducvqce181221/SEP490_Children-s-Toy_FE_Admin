const MEANINGLESS_SINGLE_TOKENS = new Set([
  "test",
  "testing",
  "qwerty",
  "qwertyuiop",
  "asdf",
  "asdfghjkl",
  "abcxyz",
]);

const MEANINGLESS_PHRASES = new Set([
  "random text",
  "lorem ipsum",
]);

const KEYBOARD_ROWS = [
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

function normalizeForMeaningCheck(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u0111\u0110]/g, "d")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRepeatedSingleCharacter(value: string): boolean {
  return new Set(value).size === 1;
}

function isRepeatedPattern(value: string): boolean {
  for (let size = 1; size <= Math.floor(value.length / 2); size += 1) {
    if (value.length % size !== 0) continue;

    const repetitions = value.length / size;
    if (repetitions < 3) continue;

    const pattern = value.slice(0, size);
    let repeated = true;
    for (let index = size; index < value.length; index += size) {
      if (value.slice(index, index + size) !== pattern) {
        repeated = false;
        break;
      }
    }

    if (repeated) return true;
  }

  return false;
}

function isKeyboardMash(value: string): boolean {
  return KEYBOARD_ROWS.some((row) => row.includes(value) || row.split("").reverse().join("").includes(value));
}

function isPlaceholderLike(normalized: string): boolean {
  if (MEANINGLESS_PHRASES.has(normalized)) return true;

  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  if (tokens.length === 1) return MEANINGLESS_SINGLE_TOKENS.has(tokens[0]);

  return tokens.length >= 2
    && tokens.every((token) => token === tokens[0])
    && MEANINGLESS_SINGLE_TOKENS.has(tokens[0]);
}

function longestConsonantRun(token: string): number {
  let longest = 0;
  let current = 0;

  for (const char of token) {
    if (!/[a-z]/.test(char) || VOWELS.has(char)) {
      current = 0;
      continue;
    }

    current += 1;
    if (current > longest) longest = current;
  }

  return longest;
}

function isSuspiciousAlphabeticToken(token: string): boolean {
  if (token.length < 6) return false;

  const vowelCount = [...token].filter((char) => VOWELS.has(char)).length;
  if (vowelCount <= 1) return true;

  return longestConsonantRun(token) >= 5;
}

function looksLikeRandomGibberish(normalized: string): boolean {
  const tokens = normalized.split(" ")
    .filter((token) => token.length >= 3 && /^[a-z]+$/i.test(token));

  if (tokens.length === 0) return false;

  const suspiciousTokens = tokens.filter(isSuspiciousAlphabeticToken);
  if (suspiciousTokens.length === 0) return false;

  return suspiciousTokens.length === tokens.length
    && tokens.reduce((sum, token) => sum + token.length, 0) >= 10;
}

function getMeaningfulInputError(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/[\p{L}\p{N}]/u.test(trimmed)) return `${fieldLabel} is invalid.`;

  const normalized = normalizeForMeaningCheck(trimmed);
  if (!normalized || !/[\p{L}\p{N}]/u.test(normalized)) return `${fieldLabel} is invalid.`;

  const compact = normalized.replace(/\s+/g, "");
  if (!/\p{L}/u.test(normalized) && /\p{N}/u.test(normalized)) {
    return `${fieldLabel} appears to be meaningless.`;
  }

  if (compact.length >= 3 && isRepeatedSingleCharacter(compact)) {
    return `${fieldLabel} appears to be meaningless.`;
  }

  if (compact.length >= 6 && isRepeatedPattern(compact)) {
    return `${fieldLabel} appears to be meaningless.`;
  }

  if (compact.length >= 5 && isKeyboardMash(compact)) {
    return `${fieldLabel} appears to be meaningless.`;
  }

  if (isPlaceholderLike(normalized)) {
    return `${fieldLabel} appears to be meaningless.`;
  }

  if (looksLikeRandomGibberish(normalized)) {
    return `${fieldLabel} appears to be meaningless.`;
  }

  return null;
}

export function validateAiGenerateInputs(input: {
  title: string;
  promptStructure: string;
  description?: string | null;
}): string | null {
  return (
    getMeaningfulInputError(input.title, "Title")
    ?? getMeaningfulInputError(input.promptStructure, "Prompt")
    ?? getMeaningfulInputError(input.description ?? "", "Prompt")
  );
}

export function flattenValidationErrors(errors: Record<string, string[]> | undefined): string | null {
  if (!errors || Object.keys(errors).length === 0) return null;

  const parts = Object.values(errors)
    .flat()
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : null;
}
