import { existsSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** fleet_backend/ */
const backendRoot = path.join(__dirname, '..', '..');
/** Repo root (parent of fleet_backend) */
const repoRoot = path.join(backendRoot, '..');

/**
 * Load .env from repo root first, then fleet_backend/.env (later overrides).
 * So you can keep DB_* in the root .env next to VITE_* or in fleet_backend/.env.
 */
export function loadBackendEnv() {
  if (existsSync(path.join(repoRoot, '.env'))) {
    dotenv.config({ path: path.join(repoRoot, '.env') });
  }
  if (existsSync(path.join(backendRoot, '.env'))) {
    dotenv.config({ path: path.join(backendRoot, '.env') });
  }
}

export { backendRoot, repoRoot };

loadBackendEnv();
