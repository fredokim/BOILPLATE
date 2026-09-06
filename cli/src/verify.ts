/**
 * Runs the generated project's own checks.
 *
 * The point is not that these commands exist — it is that a generated project
 * passes them. A generator whose output does not install is the failure this
 * catches, and it is the one that is invisible until someone tries.
 *
 * Opt-in, because it is two `npm install`s and several minutes. Off by default
 * and run in CI, which is the arrangement that keeps it honest without making
 * every generation slow.
 */

import { spawnSync } from 'node:child_process';
import type { Reporter } from './scaffold';

const STEPS = ['install', 'typecheck', 'test', 'build'] as const;

export type StepResult = { part: string; step: string; ok: boolean; detail?: string };

function run(command: string, args: string[], cwd: string): { ok: boolean; detail?: string } {
  const result = spawnSync(command, args, { cwd, stdio: 'pipe', encoding: 'utf8', shell: process.platform === 'win32' });

  if (result.status === 0) return { ok: true };

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trimEnd();

  return { ok: false, detail: output.split('\n').slice(-12).join('\n') };
}

export function verify(parts: { name: string; path: string }[], report: Reporter): StepResult[] {
  const results: StepResult[] = [];

  for (const part of parts) {
    for (const step of STEPS) {
      report(`  ${part.name}: ${step}`);

      const outcome = step === 'install' ? run('npm', ['install'], part.path) : run('npm', ['run', step], part.path);

      results.push({ part: part.name, step, ...outcome });

      /**
       * Stop this part at the first failure. Running `typecheck` after `install`
       * failed produces a second error about missing modules, which buries the
       * one that matters.
       */
      if (!outcome.ok) break;
    }
  }

  return results;
}
