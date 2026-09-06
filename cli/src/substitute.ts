/**
 * Rewrites the few things in a copied template that name the boilerplate.
 *
 * Every function here takes text and returns text, so the rules can be tested
 * without generating a project.
 *
 * The rule the whole file follows: **edit named keys in named files, never
 * search and replace across a tree.** A global rewrite of "react-boilerplate"
 * would also hit import paths, a lockfile's resolved URLs, a comment explaining
 * why something is the way it is, and — since Vue's package is called
 * `boilplate` and not `vue-boilerplate` — would miss the one place it needed to
 * land. Targeted edits fail loudly when a file changes shape. A regex over a
 * tree fails silently, which is the failure that reaches production.
 */

import { randomBytes } from 'node:crypto';
import type { Framework, Plan } from './plan';

/** Only `name`. Version, privacy and everything else belong to whoever cloned it. */
export function renamePackage(packageJson: string, name: string): string {
  const parsed: unknown = JSON.parse(packageJson);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('package.json did not parse to an object.');
  }

  const indent = /^\{\r?\n(\s+)"/.exec(packageJson)?.[1] ?? '  ';
  const trailingNewline = packageJson.endsWith('\n') ? '\n' : '';

  return JSON.stringify({ ...(parsed as Record<string, unknown>), name }, null, indent.length) + trailingNewline;
}

/**
 * Sets a variable in a dotenv file.
 *
 * Three cases, and the middle one is why this is not a one-line regex: the key
 * may be set, may be present but commented out — which is how all three
 * frontends ship their `.env.example` — or may be absent. A commented key that
 * gets a duplicate appended below it leaves a file where the answer to "what is
 * VITE_DATA_MODE" depends on which line you read first.
 */
export function setEnv(contents: string, key: string, value: string): string {
  const assignment = `${key}=${value}`;
  const live = new RegExp(`^${key}=.*$`, 'm');

  if (live.test(contents)) return contents.replace(live, assignment);

  const commented = new RegExp(`^#\\s*${key}=.*$`, 'm');

  if (commented.test(contents)) return contents.replace(commented, assignment);

  const separator = contents.endsWith('\n') || contents === '' ? '' : '\n';

  return `${contents}${separator}${assignment}\n`;
}

/** 48 bytes, because the server refuses to start on a secret under 32 characters. */
export function generateSecret(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/** Where each framework's dev server listens, which is what the server must allow. */
const DEV_ORIGIN: Readonly<Record<Framework, number>> = { react: 5173, next: 3000, vue: 5173 };

/**
 * The frontend's environment.
 *
 * With no backend, nothing is written at all: every variable is optional and the
 * commented defaults run the whole app on MSW. Writing `VITE_DATA_MODE=mock`
 * would say the same thing while looking like a decision someone made.
 */
export function frontendEnv(example: string, plan: Plan): { path: string; contents: string } | null {
  const path = plan.framework === 'next' ? '.env.local' : '.env';

  if (plan.backend === 'none') return null;

  if (plan.framework === 'next') {
    /**
     * Both, always. `BACKEND_URL` decides what the route handlers do and
     * `NEXT_PUBLIC_DATA_MODE` decides which transports the browser builds, and
     * `assertDataModeMatches` in the root layout refuses a build where they
     * disagree — half-connected looks like working software from the UI.
     *
     * Setting only the first is what this CLI did on its first CI run: the
     * generated project installed, typechecked and tested, then failed its own
     * build. Neither value can be derived from the other, because the address
     * has to stay off the client — no NEXT_PUBLIC_ prefix, or the browser could
     * call the backend directly and the sameSite=lax refresh cookie would not
     * travel.
     */
    let next = setEnv(example, 'BACKEND_URL', 'http://127.0.0.1:3001');
    next = setEnv(next, 'NEXT_PUBLIC_DATA_MODE', 'server');

    return { path, contents: next };
  }

  let contents = setEnv(example, 'VITE_DATA_MODE', 'server');
  contents = setEnv(contents, 'VITE_API_TARGET', 'http://127.0.0.1:3001');

  return { path, contents };
}

/**
 * The server's environment.
 *
 * `JWT_SECRET` ships empty and has no fallback — deliberately, since a default
 * would be a real secret in every deployment that forgot to change it. So the
 * generated project does not start until something fills it in, and that
 * something is here rather than a line in a README that gets skipped.
 */
export function serverEnv(example: string, plan: Plan, secret = generateSecret()): string {
  const port = DEV_ORIGIN[plan.framework];

  let contents = setEnv(example, 'JWT_SECRET', secret);
  contents = setEnv(contents, 'CORS_ORIGINS', `http://localhost:${String(port)},http://127.0.0.1:${String(port)}`);
  // The seed account is opt-in and the example leaves the password blank, which
  // makes `prisma:seed` fail rather than create an account nobody chose.
  contents = setEnv(contents, 'SEED_ADMIN_PASSWORD', generateSecret(12));

  return contents;
}
