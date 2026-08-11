import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const storageDir = path.resolve(process.cwd(), 'storage');

export async function appendRecord(fileName, record) {
  await mkdir(storageDir, { recursive: true });
  const filePath = path.join(storageDir, fileName);
  const records = await readRecords(fileName);
  records.push(record);
  await writeFile(filePath, JSON.stringify(records, null, 2));
  return record;
}

export async function readRecords(fileName) {
  try {
    const filePath = path.join(storageDir, fileName);
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}
