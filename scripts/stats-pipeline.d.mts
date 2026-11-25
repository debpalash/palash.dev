/** Refreshes src/generated/stats.json from the GitHub API (1h freshness window, offline-safe). */
export function refreshStats(): Promise<void>;
export function cleanGitHubToken(value: unknown): string;
export function isUserDownloadAsset(name: unknown): boolean;
export function releaseDownloadCount(releases: unknown): number;
export interface LabRepo { id: string; name: string; description: string; url: string; lang: string; stars: number; pushedAt: string | null }
export interface FeedRelease { tag: string; name: string; url: string; publishedAt: string; prerelease: boolean; summary: string; headline: string; points: string[] }
export function releaseDigest(body: unknown, max?: number): { headline: string; points: string[] };
export function releaseSummary(body: unknown, max?: number): string;
export function recentReleases(releases: unknown, limit?: number): FeedRelease[];
export function selectLabRepos(repos: unknown, owner: string, excluded?: string[]): LabRepo[];
