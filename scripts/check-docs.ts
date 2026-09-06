/**
 * Fails when a document points at something that is not there.
 *
 * The three frontends and the server have carried this check since the audit
 * that found a README still describing a NestJS server which had moved to its
 * own repository — fourteen `npm run server:*` commands no package.json had had
 * for months. Nothing failed, because nothing checked.
 *
 * This repository needed a variation. Its README is the ecosystem's entry point,
 * so most of the commands in it are not run here: `npm run db:up` belongs to the
 * server, `npm run dev` to whichever boilerplate you just cloned. Checking them
 * against this package.json would report four failures that are all correct
 * documentation, and the usual answer to that — stop checking code blocks — would
 * give up on the half of the document most likely to rot.
 *
 * So the check follows the reader instead. A `git clone` or a `cd` moves it into
 * a repository, and every `npm run` after that is resolved against *that*
 * repository's package.json. A sibling that is not checked out is skipped rather
 * than failed: the document is not wrong, this machine is just missing a
 * directory.
 *
 * Two rules, otherwise unchanged:
 *
 *   1. `npm run x` must be a script in the package.json of wherever the reader is.
 *   2. A backticked repository path must exist here.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PARENT = process.env.REPO_ROOT ?? resolve(ROOT, "..");

const HISTORICAL_MARKER = "<!-- doc-check: historical -->";

/**
 * Nothing here is historical by construction. An ADR records a decision that was
 * made, not a layout that has moved, so it is checked like anything else — an ADR
 * pointing at a file that no longer exists is exactly the rot worth catching.
 */
const HISTORICAL_DIRS: string[] = [];

/** Prefixes that name something in this repository rather than an npm package or a URL. */
const PATH_ROOTS = ["scripts", "docs", "cli"];

/**
 * GitHub name to local directory, because they differ: the repository is
 * `boilplate-react` and the checkout beside this one is `react-boilerplate`.
 * A reader cloning fresh gets the GitHub name, so both spellings resolve.
 */
const SIBLINGS: Readonly<Record<string, string>> = {
  "boilplate-react": "react-boilerplate",
  "boilplate-next": "next-boilerplate",
  "boilplate-vue": "vue-boilerplate",
  "boilplate-server": "boilplate-server",
  "react-boilerplate": "react-boilerplate",
  "next-boilerplate": "next-boilerplate",
  "vue-boilerplate": "vue-boilerplate",
};

type Problem = { doc: string; kind: "script" | "path"; detail: string };

/** Where a command in the document would run: this repository, or one beside it. */
type Location = { label: string; dir: string | null };

const HERE: Location = { label: "this repository", dir: ROOT };

function trackedDocs(): string[] {
  return execFileSync("git", ["ls-files", "*.md"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isHistorical(doc: string, text: string): boolean {
  return HISTORICAL_DIRS.some((dir) => doc.startsWith(dir)) || text.includes(HISTORICAL_MARKER);
}

/** `dir: null` means "a real place this machine does not have" — skipped, not failed. */
function locate(name: string): Location | null {
  if (name === "BOILPLATE") return HERE;

  // A subdirectory of this repository with its own package.json, such as cli/.
  if (existsSync(resolve(ROOT, name, "package.json"))) return { label: name, dir: resolve(ROOT, name) };

  const sibling = SIBLINGS[name];

  if (sibling === undefined) return null;

  const dir = resolve(PARENT, sibling);

  return { label: sibling, dir: existsSync(dir) ? dir : null };
}

function scriptsOf(dir: string): Set<string> {
  const parsed = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf8")) as { scripts?: Record<string, string> };

  return new Set(Object.keys(parsed.scripts ?? {}));
}

const scriptCache = new Map<string, Set<string>>();

function cachedScriptsOf(dir: string): Set<string> {
  const cached = scriptCache.get(dir);

  if (cached) return cached;

  const scripts = scriptsOf(dir);

  scriptCache.set(dir, scripts);

  return scripts;
}

/**
 * Reads a document top to bottom, tracking where the reader is.
 *
 * Deliberately line by line rather than block by block: a quick start often
 * clones in one fenced block and runs commands in the next, and the reader has
 * not walked back out in between.
 */
function checkDocument(doc: string, text: string, problems: Problem[]): number {
  let location = HERE;
  let skipped = 0;

  for (const line of text.split("\n")) {
    /**
     * A heading ends the session. Prose two sections below a quick start is not
     * standing in the directory that quick start cloned into, and treating it as
     * if it were made `npm run realtime:parity` — a command of this repository,
     * named in prose — resolve against the server.
     */
    if (line.startsWith("#")) location = HERE;

    for (const match of line.matchAll(/git clone \S*?\/([A-Za-z0-9_.-]+?)(?:\.git)?\b/g)) {
      const found = match[1] === undefined ? null : locate(match[1]);

      if (found) location = found;
    }

    for (const match of line.matchAll(/\bcd ([A-Za-z0-9_./-]+)/g)) {
      const target = match[1];

      if (target === undefined) continue;
      // `cd ~/projects` and the like move outside every repository we know about.
      if (target.startsWith("~") || target.startsWith("..")) {
        location = { label: target, dir: null };
        continue;
      }

      const found = locate(target.replace(/^\.\//, "").split("/")[0] ?? target);

      if (found) location = found;
    }

    for (const match of line.matchAll(/npm run ([a-z0-9:_-]+)/g)) {
      const script = match[1];

      if (script === undefined) continue;

      if (location.dir === null) {
        skipped += 1;
        continue;
      }

      if (!cachedScriptsOf(location.dir).has(script)) {
        problems.push({ doc, kind: "script", detail: `npm run ${script} (in ${location.label})` });
      }
    }
  }

  return skipped;
}

function main(): void {
  const problems: Problem[] = [];
  const docs = trackedDocs();
  let skipped = 0;

  for (const doc of docs) {
    const text = readFileSync(resolve(ROOT, doc), "utf8");

    if (isHistorical(doc, text)) continue;

    skipped += checkDocument(doc, text, problems);

    for (const match of text.matchAll(/`((?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.*-]*)`/g)) {
      const candidate = match[1];

      if (candidate === undefined) continue;

      const root = candidate.split("/")[0];

      if (root === undefined || !PATH_ROOTS.includes(root)) continue;
      // Globs and placeholders describe a shape, not a file.
      if (/[*{}<>]/.test(candidate)) continue;
      if (!existsSync(resolve(ROOT, candidate))) problems.push({ doc, kind: "path", detail: candidate });
    }
  }

  if (problems.length === 0) {
    const note = skipped > 0 ? `, ${String(skipped)} command(s) skipped in repositories not checked out here` : "";

    console.log(`check:docs — ${String(docs.length)} documents, no stale scripts or paths${note}.`);
    return;
  }

  console.error("Documents reference things that do not exist:\n");

  for (const { doc, kind, detail } of problems) {
    console.error(`  ${doc}: ${kind === "script" ? "no such script" : "no such path"} — ${detail}`);
  }

  console.error(
    `\n${String(problems.length)} problem(s). Fix the document, or mark it historical with ${HISTORICAL_MARKER} if it records a past state on purpose.`,
  );
  process.exit(1);
}

main();
