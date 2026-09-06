/**
 * Reports where the three frontends' realtime cores have stopped agreeing.
 *
 * The React, Vue and Next boilerplates each carry their own copy of the chat and
 * topology realtime layer: the controller with its backoff and jitter, the two
 * stores with their dedup and flush batching, the transport interfaces, the mock
 * transports, and the frame validators. Eleven files, about 1,300 lines, three
 * times over.
 *
 * They are duplicated on purpose — ADR 0001 has the reasoning — and the whole
 * bet is that they stay the same. Nothing was checking, and by the time anyone
 * looked they had already drifted: an em dash in one repo where the other two
 * had `--`, `Unsubscribe` in one signature where the others wrote `() => void`,
 * two fields declared in a different order. Harmless in themselves, and exactly
 * what a real divergence would hide behind.
 *
 * Comparison is by normalised text, not by AST. Two things are normalised away
 * because they are settled per-repo conventions rather than decisions about this
 * code: line endings, and single versus double quotes. Everything else — a
 * different default, a missing branch, a comment that no longer describes what
 * the file does — is reported.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Repo = { name: string; root: string; features: string };

/**
 * Defaults assume the four repos are checked out side by side, which is how CI
 * arranges them and how they sit locally. `REPO_ROOT` overrides the parent.
 */
const parent = process.env.REPO_ROOT ?? resolve(import.meta.dirname, '..', '..');

const REPOS: readonly Repo[] = [
  { name: 'react', root: resolve(parent, 'react-boilerplate'), features: 'src/features' },
  { name: 'next', root: resolve(parent, 'next-boilerplate'), features: 'src/features' },
  { name: 'vue', root: resolve(parent, 'vue-boilerplate'), features: 'src/app/modules' },
];

/**
 * The files that must agree.
 *
 * Deliberately a list rather than a directory sweep. `serverChatTransport.ts`
 * and `serverTopologySource.ts` sit in the same folders and are *not* here:
 * they speak to each repo's own HTTP client and auth storage, so they differ for
 * a reason. A sweep would either flag those forever or have to exclude them,
 * and an exclusion list is the one that rots quietly.
 */
const SHARED = [
  'live-experience/chat/realtime/chatController.ts',
  'live-experience/chat/realtime/chatStore.ts',
  'live-experience/chat/realtime/chatTransport.ts',
  'live-experience/chat/realtime/mockChatTransport.ts',
  'live-experience/chat/realtime/types.ts',
  'visual-graph/realtime/controller.ts',
  'visual-graph/realtime/runtimeStore.ts',
  'visual-graph/realtime/transport.ts',
  'visual-graph/realtime/types.ts',
  'visual-graph/realtime/mockTransport.ts',
  'visual-graph/realtime/serverTopologyFrame.ts',
] as const;

/** Line endings and quote style are per-repo conventions, not decisions about this code. */
function normalise(source: string): string {
  return source.replace(/\r\n/g, '\n').replace(/"/g, "'");
}

const digest = (text: string): string => createHash('sha256').update(text).digest('hex').slice(0, 8);

type Reading = { repo: string; hash: string; lines: number } | { repo: string; missing: true };

function read(repo: Repo, relative: string): Reading {
  try {
    const normalised = normalise(readFileSync(resolve(repo.root, repo.features, relative), 'utf8'));
    return { repo: repo.name, hash: digest(normalised), lines: normalised.split('\n').length };
  } catch {
    return { repo: repo.name, missing: true };
  }
}

let divergent = 0;
let unreadable = 0;

console.log(`realtime:parity — ${String(SHARED.length)} shared files across ${String(REPOS.length)} repos\n`);

for (const relative of SHARED) {
  const readings = REPOS.map((repo) => read(repo, relative));
  const missing = readings.filter((reading) => 'missing' in reading);

  if (missing.length > 0) {
    unreadable += 1;
    console.log(`  ✗ ${relative}`);
    console.log(`      not found in: ${missing.map((reading) => reading.repo).join(', ')}`);
    continue;
  }

  const present = readings.filter((reading): reading is Extract<Reading, { hash: string }> => 'hash' in reading);
  const hashes = new Set(present.map((reading) => reading.hash));

  if (hashes.size === 1) {
    const first = present[0];
    console.log(`  ✓ ${relative}  (${String(first?.lines ?? 0)} lines)`);
    continue;
  }

  divergent += 1;
  console.log(`  ✗ ${relative}`);
  for (const reading of present) console.log(`      ${reading.repo.padEnd(6)} ${reading.hash}  ${String(reading.lines)} lines`);
}

console.log('');

if (unreadable > 0) {
  // Not a divergence — the check could not run. Saying "in sync" here would be
  // the exact failure this script exists to prevent.
  console.error(`realtime:parity — ${String(unreadable)} file(s) could not be read in every repo. Are all three checked out?`);
  process.exit(2);
}

if (divergent > 0) {
  console.error(
    `realtime:parity — ${String(divergent)} of ${String(SHARED.length)} shared files differ.\n` +
      `Diff them and decide: land the same change in all three, or move the file out of the shared list\n` +
      `in this script with a note saying why it is allowed to differ.`,
  );
  process.exit(1);
}

console.log(`realtime:parity — all ${String(SHARED.length)} shared files agree.`);
