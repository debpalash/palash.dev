import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cleanGitHubToken,
  isUserDownloadAsset,
  releaseDownloadCount,
  selectLabRepos,
  releaseSummary,
  recentReleases,
  releaseDigest,
} from './stats-pipeline.mjs';

test('extracts a standalone token from command-shim notices', () => {
  const token = 'gho_abcdefghijklmnopqrstuvwxyz123456';
  assert.equal(cleanGitHubToken(`mise notice\n${token}\n`), token);
});

test('accepts a fine-grained token format', () => {
  const token = 'github_pat_abcdefghijklmnopqrstuvwxyz123456';
  assert.equal(cleanGitHubToken(token), token);
});

test('rejects shell notices and whitespace inside a credential', () => {
  assert.equal(cleanGitHubToken('mise notice only'), '');
  assert.equal(cleanGitHubToken('gho_invalid token value'), '');
  assert.equal(cleanGitHubToken('gho_too_short'), '');
});

test('recognizes installable release binaries and archives', () => {
  for (const name of [
    'VoiceStudio.AppImage',
    'VoiceStudio.dmg',
    'VoiceStudio.msi',
    'bootable.exe',
    'opal.zip',
    'opal.deb',
    'opal.rpm',
    'opal.run',
    'voice-studio.tar.gz',
  ]) {
    assert.equal(isUserDownloadAsset(name), true, name);
  }
});

test('rejects metadata, checksums, signatures, scripts, and appended suffixes', () => {
  for (const name of [
    'latest.json',
    'SHA256SUMS.txt',
    'VoiceStudio.AppImage.sig',
    'bootable.tar.gz.sha256',
    'provenance.intoto.jsonl',
    'uninstall.sh',
    '',
  ]) {
    assert.equal(isUserDownloadAsset(name), false, name);
  }
  assert.equal(isUserDownloadAsset(null), false);
});

test('counts only user-downloadable assets from public stable releases', () => {
  const releases = [
    {
      draft: false,
      prerelease: false,
      assets: [
        { name: 'app.AppImage', download_count: 8 },
        { name: 'app.AppImage.sig', download_count: 40 },
        { name: 'latest.json', download_count: 100 },
        { name: 'app.tar.gz', download_count: 3 },
        { name: 'app.zip', download_count: -1 },
      ],
    },
    {
      draft: false,
      prerelease: true,
      assets: [{ name: 'preview.dmg', download_count: 20 }],
    },
    {
      draft: true,
      prerelease: false,
      assets: [{ name: 'private.msi', download_count: 30 }],
    },
  ];

  assert.equal(releaseDownloadCount(releases), 11);
  assert.equal(releaseDownloadCount(null), 0);
});

test('lab repos skip forks, archives, the profile repo, and products', () => {
  const repo = (name, extra = {}) => ({ name, full_name: `debpalash/${name}`, owner: { login: 'debpalash' }, html_url: `https://github.com/debpalash/${name}`, stargazers_count: 0, fork: false, archived: false, private: false, ...extra });
  const picked = selectLabRepos([
    repo('sshbox', { stargazers_count: 1, language: 'Go', description: 'SSH CLI' }),
    repo('hoglet', { stargazers_count: 3 }),
    repo('moshi', { fork: true }),
    repo('old', { archived: true }),
    repo('debpalash'),
    repo('Opal', { stargazers_count: 64 }),
    repo('memXT', { owner: { login: 'Yupcha' }, full_name: 'Yupcha/memXT' }),
  ], 'debpalash', ['debpalash/Opal', 'Opal']);
  assert.deepEqual(picked.map((r) => r.name), ['hoglet', 'sshbox']);
  assert.equal(picked[1].lang, 'Go');
  assert.equal(picked[1].description, 'SSH CLI');
});

test('lab repos tolerate a bad payload', () => {
  assert.deepEqual(selectLabRepos(null, 'debpalash'), []);
});

test('release summaries read as plain text', () => {
  const body = '## Highlights\r\n\r\n**Your voice, another language.** See [docs](https://x.dev) ![shot](a.png)\n\n- Faster `setup`\n\n**Full Changelog**: v1...v2';
  assert.equal(releaseSummary(body), 'Your voice, another language. See docs Faster setup');
  assert.equal(releaseSummary('Releaser: Palash\nBootable v1\nReal notes here.', 180, ['Bootable v1']), 'Real notes here.');
  assert.equal(releaseSummary('word '.repeat(80), 30).endsWith('…'), true);
  assert.equal(releaseSummary(null), '');
  assert.equal(releaseSummary('Builds for x86_64 and _all_ targets.'), 'Builds for x86_64 and all targets.');
});

test('recent releases skip drafts and keep the newest', () => {
  const r = (tag, date, extra = {}) => ({ tag_name: tag, name: '', html_url: `u/${tag}`, published_at: date, draft: false, prerelease: false, body: 'Notes', ...extra });
  const picked = recentReleases([r('v1', '2026-01-01'), r('v0', '2025-01-01'), r('v3', '2026-03-01', { draft: true }), r('v2', '2026-02-01', { prerelease: true })]);
  assert.deepEqual(picked.map((x) => x.tag), ['v1', 'v0']);
  assert.equal(picked[0].name, 'v1');
  const onlyPre = recentReleases([r('rc1', '2026-02-01', { prerelease: true })]);
  assert.equal(onlyPre[0].prerelease, true);
});

test('release digest takes the bold lead and prose sentences', () => {
  const body = '**Talks to your tools.** Answer calls in a saved voice. Integration cards are clearer.\r\n\r\nAlso fixes chapters.\n\n**Download**\n\n| Platform | Installer |\n| --- | --- |\n| Linux | [AppImage](https://x/a.AppImage) |';
  assert.deepEqual(releaseDigest(body), { headline: 'Talks to your tools.', points: ['Answer calls in a saved voice.', 'Integration cards are clearer.', 'Also fixes chapters.'] });
});

test('release digest reads bolded bullets and skips metadata and PR noise', () => {
  const body = '## Highlights\n\n**Releaser:** Someone\n\n- **Files open fast.** Details\n  continue here.\n- **Now Playing is immersive.** More.\n- Plain point by @dev in https://github.com/x/y/pull/1\n\n**Full Changelog**: https://github.com/x/y/compare/a...b';
  assert.deepEqual(releaseDigest(body), { headline: 'Files open fast.', points: ['Now Playing is immersive.', 'Plain point'] });
  assert.deepEqual(releaseDigest(''), { headline: '', points: [] });
});
