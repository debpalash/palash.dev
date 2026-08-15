// Standalone entry (`npm run stats`); the Vite plugin calls refreshStats()
// directly at build start.
import { refreshStats } from './stats-pipeline.mjs';

await refreshStats();
