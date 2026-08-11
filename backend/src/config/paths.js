import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

export const backendRoot = path.resolve(configDirectory, '../..');
export const projectRoot = path.resolve(backendRoot, '..');
export const clientDistDir = path.join(projectRoot, 'client', 'dist');
export const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(projectRoot, process.env.UPLOAD_DIR)
  : path.join(backendRoot, 'uploads');
