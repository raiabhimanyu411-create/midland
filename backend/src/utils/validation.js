export function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] || '').trim());

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }

  return { valid: true };
}

export function cleanText(value) {
  return String(value || '').trim();
}

export function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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
