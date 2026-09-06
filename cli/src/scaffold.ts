/**
 * Copies the templates and applies the plan to what came out.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { frontendEnv, renamePackage, serverEnv } from './substitute';
import { partsOf, type Plan } from './plan';

export type Reporter = (line: string) => void;

/**
 * A shallow clone with its history removed, rather than a tarball download.
 *
 * `--depth 1` fetches one commit, so this is not meaningfully slower, and it
 * needs only git — which anyone who is about to work in the generated project
 * already has. Unpacking a tarball in Node without a dependency is more code
 * than this whole file.
 */
function clone(repo: string, ref: string, into: string, report: Reporter): void {
  report(`  fetching ${repo}#${ref}`);

  try {
    execFileSync('git', ['clone', '--depth', '1', '--single-branch', '--branch', ref, `https://github.com/${repo}.git`, into], {
      stdio: 'pipe',
    });
  } catch (error) {
    /**
     * git's own message is "Remote branch x not found in upstream origin",
     * which does not say which repository was asked or that `--ref` is the
     * thing to change.
     */
    const detail = error instanceof Error ? error.message.split('\n')[0] ?? '' : String(error);

    throw new Error(`Could not fetch ${repo}#${ref}. Check the ref exists, or that git can reach GitHub.\n  ${detail}`);
  }

  // The generated project is its own project. Carrying the boilerplate's history
  // would make its first `git log` a record of someone else's decisions.
  rmSync(join(into, '.git'), { recursive: true, force: true });
}

function editFile(path: string, edit: (contents: string) => string): void {
  writeFileSync(path, edit(readFileSync(path, 'utf8')));
}

export type ScaffoldResult = { directory: string; parts: { name: string; path: string }[] };

export function scaffold(plan: Plan, report: Reporter): ScaffoldResult {
  const preexisting = existsSync(plan.directory);

  if (preexisting && readdirSync(plan.directory).length > 0) {
    throw new Error(`${plan.directory} already exists and is not empty.`);
  }

  const parts = partsOf(plan);
  const single = parts.length === 1;

  mkdirSync(plan.directory, { recursive: true });

  const written: { name: string; path: string }[] = [];

  try {
    return generate(plan, parts, single, written, report);
  } catch (error) {
    /**
     * Take the half-made project with us.
     *
     * A clone that fails partway leaves a directory that is not a project and
     * cannot be generated into again — the next attempt is refused for "already
     * exists and is not empty", which describes the wreckage of the previous
     * attempt rather than anything the person did. Only what this run created is
     * removed; a directory that was already there, empty, is left where it was.
     */
    if (preexisting) {
      // Empty it, but leave the directory itself — it was not ours to remove.
      for (const entry of readdirSync(plan.directory)) {
        rmSync(join(plan.directory, entry), { recursive: true, force: true });
      }
    } else {
      rmSync(plan.directory, { recursive: true, force: true });
    }

    throw error;
  }
}

function generate(
  plan: Plan,
  parts: ReturnType<typeof partsOf>,
  single: boolean,
  written: { name: string; path: string }[],
  report: Reporter,
): ScaffoldResult {
  for (const part of parts) {
    /**
     * A frontend-only project is the project, not a `frontend/` directory inside
     * an otherwise empty one. With a backend there are two packages and they need
     * somewhere to sit.
     */
    const path = single ? plan.directory : join(plan.directory, part.dir);

    clone(part.repo, plan.ref, path, report);

    editFile(join(path, 'package.json'), (contents) => renamePackage(contents, part.name));
    report(`  ${part.dir}: package renamed to ${part.name}`);

    const example = join(path, '.env.example');

    if (part.dir === 'server') {
      writeFileSync(join(path, '.env'), serverEnv(readFileSync(example, 'utf8'), plan));
      report('  server: .env written with a generated JWT_SECRET');
    } else {
      const env = frontendEnv(readFileSync(example, 'utf8'), plan);

      if (env) {
        writeFileSync(join(path, env.path), env.contents);
        report(`  ${part.dir}: ${env.path} written, pointing at the local server`);
      } else {
        report(`  ${part.dir}: no .env written — the defaults run it on mock data`);
      }
    }

    written.push({ name: part.name, path });
  }

  return { directory: plan.directory, parts: written };
}
