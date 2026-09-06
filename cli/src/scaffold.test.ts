import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { scaffold } from './scaffold';
import { resolvePlan, type Plan } from './plan';

const silent = () => {};

function planIn(cwd: string, over: { appName?: string; ref?: string } = {}): Plan {
  const resolved = resolvePlan({
    appName: over.appName ?? 'probe',
    framework: 'react',
    backend: 'none',
    ref: over.ref ?? 'no-such-branch-@@',
    cwd,
  });

  if (!resolved.ok) throw new Error(resolved.reason);

  return resolved.plan;
}

const temp = () => mkdtempSync(join(tmpdir(), 'create-fredo-'));

describe('scaffold', () => {
  /**
   * The ref does not exist, so the clone fails partway. What must not survive is
   * the directory: a half-made project is refused by the next attempt for
   * "already exists and is not empty", which describes the wreckage of the
   * previous run rather than anything the person did.
   */
  it('leaves nothing behind when generation fails', () => {
    const cwd = temp();

    try {
      assert.throws(() => scaffold(planIn(cwd), silent), /Could not fetch/);
      assert.equal(existsSync(join(cwd, 'probe')), false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  /** A directory someone made themselves is theirs. Empty it, do not remove it. */
  it('keeps a directory that was already there, and empties it', () => {
    const cwd = temp();
    const target = join(cwd, 'probe');

    mkdirSync(target);

    try {
      assert.throws(() => scaffold(planIn(cwd), silent));
      assert.equal(existsSync(target), true);
      assert.deepEqual(readdirSync(target), []);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('refuses a directory that already has something in it', () => {
    const cwd = temp();
    const target = join(cwd, 'probe');

    mkdirSync(target);
    writeFileSync(join(target, 'notes.md'), 'mine');

    try {
      assert.throws(() => scaffold(planIn(cwd), silent), /already exists and is not empty/);
      assert.deepEqual(readdirSync(target), ['notes.md']);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
