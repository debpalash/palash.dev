import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cleanGitHubToken,
  isUserDownloadAsset,
  releaseDownloadCount,
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
