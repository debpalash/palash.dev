/** Refreshes src/generated/stats.json from the GitHub API (1h freshness window, offline-safe). */
export function refreshStats(): Promise<void>;
export function cleanGitHubToken(value: unknown): string;
export function isUserDownloadAsset(name: unknown): boolean;
export function releaseDownloadCount(releases: unknown): number;
