export function requireFields(body, fields) {
  const source = body || {};
  const missing = fields.filter((field) => {
    const value = source[field];
    if (typeof value === 'number') return !Number.isFinite(value);
    return !String(value ?? '').trim();
  });

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }

  return { valid: true };
}

export function cleanText(value, maxLength = Infinity) {
  if (value === null || value === undefined || typeof value === 'object') return '';
  return String(value).trim().slice(0, maxLength);
}

export function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

// Query strings can arrive as arrays (?make=a&make=b); only a single string value is accepted.
export function queryText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Returns a positive integer or null, so invalid ids and filters never reach SQL as NaN.
export function positiveInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function clampInt(value, { min, max, fallback }) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

export function escapeLike(value) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function createRecord(type, payload) {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    status: 'new',
    createdAt: new Date().toISOString(),
    ...payload
  };
}
