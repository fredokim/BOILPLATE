/**
 * What to generate, decided before anything touches the disk.
 *
 * Kept separate from the code that clones and writes because this is the part
 * with rules in it — which combinations exist, which are refused and why — and
 * that is the part worth testing without a network or a filesystem.
 */

export type Framework = 'react' | 'next' | 'vue';
export type Backend = 'nest' | 'none';
export type Database = 'postgres' | 'none';

export type Plan = {
  appName: string;
  directory: string;
  framework: Framework;
  backend: Backend;
  database: Database;
  /** The branch or tag to take the templates from. */
  ref: string;
  verify: boolean;
};

export const FRAMEWORKS: readonly Framework[] = ['react', 'next', 'vue'];
export const BACKENDS: readonly Backend[] = ['nest', 'none'];

type Template = { repo: string; dir: string; devPort: number };

/**
 * Where each part comes from.
 *
 * Cloned from GitHub rather than vendored here. A vendored copy is stale the
 * day after it is taken, and this CLI has no way to know that it is — it would
 * happily generate last month's boilerplate and report success.
 */
export const FRONTEND_TEMPLATES: Readonly<Record<Framework, Template>> = {
  react: { repo: 'fredokim/boilplate-react', dir: 'frontend', devPort: 5173 },
  next: { repo: 'fredokim/boilplate-next', dir: 'frontend', devPort: 3000 },
  vue: { repo: 'fredokim/boilplate-vue', dir: 'frontend', devPort: 5173 },
};

export const SERVER_TEMPLATE: Template = { repo: 'fredokim/boilplate-server', dir: 'server', devPort: 3001 };

/**
 * npm forbids these, and a name that fails validation only surfaces at
 * `npm install` — after several hundred files have been written.
 */
const NPM_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function normaliseAppName(raw: string): string {
  return raw
    .trim()
    .replace(/^.*[/\\]/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export type Resolution = { ok: true; plan: Plan } | { ok: false; reason: string };

/**
 * Turns answers into a plan, or refuses.
 *
 * Refusing is the interesting half. The MVP covers three frameworks with or
 * without the Nest backend, which is six combinations; everything else in the
 * design — picking individual features, another database, a backend without one
 * — is named here rather than half-built, because a generator that produces a
 * project which does not install is worse than one that says no.
 */
export function resolvePlan(input: {
  appName: string;
  framework: string;
  backend: string;
  database?: string | undefined;
  ref?: string | undefined;
  verify?: boolean | undefined;
  cwd: string;
}): Resolution {
  const appName = normaliseAppName(input.appName);

  if (!appName) return { ok: false, reason: 'A project name is required: create-fredo-app <name>' };
  if (!NPM_NAME.test(appName)) {
    return { ok: false, reason: `"${appName}" is not a usable npm package name. Use lowercase letters, digits and dashes.` };
  }

  if (!FRAMEWORKS.includes(input.framework as Framework)) {
    return { ok: false, reason: `Unknown framework "${input.framework}". Choose one of: ${FRAMEWORKS.join(', ')}.` };
  }
  if (!BACKENDS.includes(input.backend as Backend)) {
    return { ok: false, reason: `Unknown backend "${input.backend}". Choose one of: ${BACKENDS.join(', ')}.` };
  }

  const framework = input.framework as Framework;
  const backend = input.backend as Backend;

  /**
   * Derived rather than asked, in the MVP.
   *
   * The server's config validation requires `DATABASE_URL` and its Prisma client
   * is generated from a Postgres schema, so "Nest without a database" is not a
   * project that starts. Offering it as a choice would mean offering a broken
   * one.
   */
  const database: Database = backend === 'nest' ? 'postgres' : 'none';

  if (input.database && input.database !== database) {
    return {
      ok: false,
      reason:
        backend === 'nest'
          ? 'The Nest backend requires PostgreSQL: its Prisma schema and config validation both assume it. Pass --backend none for a frontend-only project.'
          : 'A database without a backend has nothing to talk to it. Pass --backend nest to include one.',
    };
  }

  return {
    ok: true,
    plan: {
      appName,
      directory: `${input.cwd.replace(/[/\\]+$/, '')}/${appName}`,
      framework,
      backend,
      database,
      ref: input.ref ?? 'main',
      verify: input.verify ?? false,
    },
  };
}

/** The parts a plan produces, in the order they are generated. */
export function partsOf(plan: Plan): { name: string; repo: string; dir: string }[] {
  const frontend = FRONTEND_TEMPLATES[plan.framework];
  const parts = [{ name: plan.appName, repo: frontend.repo, dir: frontend.dir }];

  if (plan.backend === 'nest') {
    parts.push({ name: `${plan.appName}-server`, repo: SERVER_TEMPLATE.repo, dir: SERVER_TEMPLATE.dir });
  }

  return parts;
}
