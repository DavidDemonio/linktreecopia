import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');

const fileLocks = new Map();

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function queueFor(filePath, task) {
  const previous = fileLocks.get(filePath) || Promise.resolve();
  const next = previous
    .then(() => task())
    .finally(() => {
      if (fileLocks.get(filePath) === next) {
        fileLocks.delete(filePath);
      }
    });
  fileLocks.set(filePath, next);
  return next;
}

function resolveDataPath(filename) {
  return path.join(dataDir, filename);
}

async function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(tempPath, `${json}\n`, 'utf-8');
  await fs.rename(tempPath, filePath);
}

export async function readJson(filename, defaultValue) {
  const filePath = resolveDataPath(filename);
  if (!(await fileExists(filePath))) {
    if (defaultValue !== undefined) {
      await queueFor(filePath, () => writeJsonFile(filePath, defaultValue));
      return defaultValue;
    }
    throw new Error(`Data file not found: ${filename}`);
  }
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content || 'null');
}

export async function writeJson(filename, data) {
  const filePath = resolveDataPath(filename);
  return queueFor(filePath, () => writeJsonFile(filePath, data));
}

export async function updateJson(filename, updater, defaultValue) {
  const filePath = resolveDataPath(filename);
  return queueFor(filePath, async () => {
    const exists = await fileExists(filePath);
    let current;
    if (!exists && defaultValue !== undefined) {
      current = defaultValue;
    } else if (!exists) {
      throw new Error(`Data file not found: ${filename}`);
    } else {
      const content = await fs.readFile(filePath, 'utf-8');
      current = JSON.parse(content || 'null');
    }
    const next = await updater(current);
    await writeJsonFile(filePath, next);
    return next;
  });
}

export { resolveDataPath };
