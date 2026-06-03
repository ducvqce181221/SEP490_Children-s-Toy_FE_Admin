const KEYBOARD_ROWS = [
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
export const MAX_BLOG_CATEGORY_ID = 32767;

const KEYBOARD_COORDINATES = new Map<string, [number, number]>();

KEYBOARD_ROWS.forEach((row, rowIndex) => {
  const rowOffset = rowIndex * 0.5;
  row.split("").forEach((char, columnIndex) => {
    KEYBOARD_COORDINATES.set(char, [columnIndex + rowOffset, rowIndex]);
  });
});

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
    if (repetitions < 2) continue;

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

function isNearRepeatedPattern(value: string): boolean {
  if (value.length < 6) {
    return false;
  }

  if (isRepeatedPattern(value)) {
    return true;
  }

  for (let index = 0; index < value.length; index += 1) {
    const withoutOneChar = value.slice(0, index) + value.slice(index + 1);
    if (withoutOneChar.length >= 6 && isRepeatedPattern(withoutOneChar)) {
      return true;
    }
  }

  return false;
}

function isKeyboardMash(value: string): boolean {
  if (value.length < 3 || !/^[a-z]+$/i.test(value)) return false;

  const directRowMash = KEYBOARD_ROWS.some(
    (row) => row.includes(value) || row.split("").reverse().join("").includes(value),
  );
  if (directRowMash) return true;

  if (value.length > 8 || !isKeyboardWalk(value)) return false;

  const vowelRatio = getVowelRatio(value);
  return longestConsonantRun(value) >= 2 || vowelRatio < 0.3 || getUniqueLetterRatio(value) <= 0.6;
}

function isKeyboardChunk(value: string): boolean {
  return value.length >= 2
    && KEYBOARD_ROWS.some((row) => row.includes(value) || row.split("").reverse().join("").includes(value));
}

function isKeyboardWalk(value: string): boolean {
  for (let index = 1; index < value.length; index += 1) {
    const previous = KEYBOARD_COORDINATES.get(value[index - 1]);
    const current = KEYBOARD_COORDINATES.get(value[index]);
    if (!previous || !current) return false;

    const horizontalDistance = Math.abs(previous[0] - current[0]);
    const verticalDistance = Math.abs(previous[1] - current[1]);
    if (horizontalDistance > 1.5 || verticalDistance > 1) {
      return false;
    }
  }

  return true;
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

function getVowelRatio(token: string): number {
  if (token.length === 0) return 0;

  const vowelCount = [...token].filter((char) => VOWELS.has(char)).length;
  return vowelCount / token.length;
}

function getUniqueLetterRatio(token: string): number {
  if (token.length === 0) return 0;
  return new Set(token).size / token.length;
}

function hasRepeatedKeyboardChunk(token: string): boolean {
  if (token.length < 6) return false;

  for (let size = 3; size <= Math.min(4, Math.floor(token.length / 2)); size += 1) {
    const counts = new Map<string, number>();
    for (let index = 0; index <= token.length - size; index += 1) {
      const chunk = token.slice(index, index + size);
      if (!isKeyboardChunk(chunk)) continue;

      counts.set(chunk, (counts.get(chunk) ?? 0) + 1);
      if ((counts.get(chunk) ?? 0) >= 2) {
        return true;
      }
    }
  }

  return false;
}

function hasLowDiversityNoiseShape(token: string): boolean {
  if (token.length < 7) return false;

  const uniqueLetters = new Set(token).size;
  if (uniqueLetters > 3) return false;

  const bigrams = new Set<string>();
  for (let index = 0; index < token.length - 1; index += 1) {
    bigrams.add(token.slice(index, index + 2));
  }

  return bigrams.size / (token.length - 1) <= 0.55;
}

function isSuspiciousAlphabeticToken(token: string): boolean {
  if (token.length < 3) return false;

  if (isKeyboardMash(token) || isNearRepeatedPattern(token) || hasRepeatedKeyboardChunk(token)) {
    return true;
  }

  const longestConsonants = longestConsonantRun(token);
  const vowelCount = [...token].filter((char) => VOWELS.has(char)).length;
  if (token.length <= 4) {
    return vowelCount === 0 || longestConsonants >= token.length;
  }

  if (vowelCount === 0) return true;
  if (vowelCount <= 1) return true;
  if (longestConsonants >= 4) return true;
  if (getVowelRatio(token) < 0.25) return true;

  return hasLowDiversityNoiseShape(token);
}

function isLowVowelNoiseToken(token: string): boolean {
  if (token.length < 5) return false;

  const vowelRatio = getVowelRatio(token);
  if (vowelRatio > 0.35) return false;

  return longestConsonantRun(token) >= 3 || getUniqueLetterRatio(token) <= 0.45;
}

function isSuspiciousMixedAlphanumericToken(token: string): boolean {
  if (!/[a-z]/i.test(token) || !/\d/.test(token)) {
    return false;
  }

  const lettersOnly = token.replace(/[^a-z]/gi, "");
  if (lettersOnly.length < 3) {
    return true;
  }

  const digitGroups = token.match(/\d+/g)?.length ?? 0;
  const letterSegments = token.split(/\d+/).filter(Boolean);
  if (letterSegments.length >= 2) {
    return true;
  }

  return isSuspiciousAlphabeticToken(lettersOnly)
    || isLowVowelNoiseToken(lettersOnly)
    || digitGroups >= 2;
}

function looksLikeRandomGibberish(normalized: string): boolean {
  const rawTokens = normalized.split(" ").filter(Boolean);
  if (rawTokens.some((token) => isSuspiciousMixedAlphanumericToken(token))) {
    return true;
  }

  const tokens = rawTokens.filter((token) => token.length >= 3 && /^[a-z]+$/i.test(token));

  if (tokens.length === 0) return false;

  const suspiciousTokens = tokens.filter((token) => isSuspiciousAlphabeticToken(token) || isLowVowelNoiseToken(token));
  if (suspiciousTokens.length === 0) return false;

  return suspiciousTokens.length === tokens.length;
}

function getMeaningfulInputError(value: string, fieldLabel: string): string | null {
  const meaninglessError = `${fieldLabel} appears to be meaningless.`;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/[\p{L}\p{N}]/u.test(trimmed)) return `${fieldLabel} is invalid.`;

  const normalized = normalizeForMeaningCheck(trimmed);
  if (!normalized || !/[\p{L}\p{N}]/u.test(normalized)) return `${fieldLabel} is invalid.`;

  const compact = normalized.replace(/\s+/g, "");
  if (!/\p{L}/u.test(normalized) && /\p{N}/u.test(normalized)) {
    return meaninglessError;
  }

  if (compact.length < 3 && normalized.split(" ").filter(Boolean).length === 1) {
    return meaninglessError;
  }

  if (compact.length >= 2 && isRepeatedSingleCharacter(compact)) {
    return meaninglessError;
  }

  if (compact.length >= 4 && isRepeatedPattern(compact)) {
    return meaninglessError;
  }

  if (isNearRepeatedPattern(compact)) {
    return meaninglessError;
  }

  if (isKeyboardMash(compact)) {
    return meaninglessError;
  }

  if (looksLikeRandomGibberish(normalized)) {
    return meaninglessError;
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

export function validateAiGenerateCategoryId(categoryId: number): string | null {
  if (!Number.isInteger(categoryId) || categoryId <= 0 || categoryId > MAX_BLOG_CATEGORY_ID) {
    return "Category is invalid.";
  }

  return null;
}

export function flattenValidationErrors(errors: Record<string, string[]> | undefined): string | null {
  if (!errors || Object.keys(errors).length === 0) return null;

  const parts = Object.values(errors)
    .flat()
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : null;
}
