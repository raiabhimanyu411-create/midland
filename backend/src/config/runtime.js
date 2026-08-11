const weakSecrets = new Set([
  'development-only-change-this-secret',
  'replace-with-a-long-random-production-secret'
]);

export const isProduction = process.env.NODE_ENV === 'production';

export function validateRuntimeConfig() {
  if (!isProduction) return;

  const errors = [];
  const jwtSecret = String(process.env.JWT_SECRET || '');

  if (jwtSecret.length < 32 || weakSecrets.has(jwtSecret)) {
    errors.push('JWT_SECRET must be a unique random value of at least 32 characters');
  }

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    errors.push('DB_HOST, DB_USER and DB_NAME are required');
  }

  if (errors.length) {
    throw new Error(`Invalid production configuration:\n- ${errors.join('\n- ')}`);
  }
}
