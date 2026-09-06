#!/usr/bin/env node
/**
 * create-fredo-app — generates a project from the boilerplates.
 *
 * The other half of stage 6's split. Each framework repo keeps its own
 * `generate:*` scripts, which make a page or a feature *inside* a project that
 * already exists; this makes the project. They are different tools that were
 * only ever grouped by sharing a verb.
 *
 * The MVP is three frameworks with or without the Nest backend. Choosing
 * individual features — auth, dashboard, realtime topology, live chat — is in
 * the design and not in this: removing a feature from a working app means its
 * routes, its tests, its navigation entries and its mock handlers, and a
 * half-removed feature produces a project that does not build. `--help` says so
 * rather than offering a switch that does nothing.
 */

import { argv, exit, stdout } from 'node:process';
import { ask, askName } from './prompt';
import { resolvePlan, type Backend, type Framework } from './plan';
import { scaffold } from './scaffold';
import { verify } from './verify';

const HELP = `create-fredo-app <name> [options]

  --framework  react | next | vue
  --backend    nest | none
  --ref        branch or tag to take the templates from (default: main)
  --verify     run install, typecheck, test and build in what was generated
  --yes        do not prompt; requires --framework and --backend
  --help

Implemented: any framework, with or without the Nest backend. PostgreSQL comes
with the backend and is not a separate choice — the server's Prisma schema and
its config validation both require it.

Not implemented: choosing individual features. Generated projects include auth,
the dashboard, realtime topology and live chat.
`;

type Flags = {
  framework?: string | undefined;
  backend?: string | undefined;
  ref?: string | undefined;
  verify: boolean;
  yes: boolean;
  help: boolean;
};

function parseFlags(args: readonly string[]): { name: string; flags: Flags } {
  const flags: Flags = { verify: false, yes: false, help: false };
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--verify') flags.verify = true;
    else if (arg === '--yes' || arg === '-y') flags.yes = true;
    else if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg === '--framework') flags.framework = args[(index += 1)];
    else if (arg === '--backend') flags.backend = args[(index += 1)];
    else if (arg === '--ref') flags.ref = args[(index += 1)];
    else if (arg?.startsWith('-')) throw new Error(`Unknown option ${arg}. Try --help.`);
    else if (arg) positional.push(arg);
  }

  return { name: positional[0] ?? '', flags };
}

const report = (line: string) => {
  stdout.write(`${line}\n`);
};

async function main(): Promise<number> {
  const { name, flags } = parseFlags(argv.slice(2));

  if (flags.help) {
    stdout.write(HELP);
    return 0;
  }

  const appName = flags.yes || name ? name : await askName('my-app');

  const framework =
    flags.framework ??
    (flags.yes
      ? ''
      : await ask<Framework>('Framework', [
          { value: 'react', label: 'React', note: 'Vite, React Query, axios' },
          { value: 'next', label: 'Next.js', note: 'App Router, route handlers forward to the backend' },
          { value: 'vue', label: 'Vue', note: 'Vite, Pinia' },
        ]));

  const backend =
    flags.backend ??
    (flags.yes
      ? ''
      : await ask<Backend>('Backend', [
          { value: 'nest', label: 'NestJS + PostgreSQL', note: 'auth, chat, topology, the real API' },
          { value: 'none', label: 'None', note: 'the frontend runs on MSW mock data' },
        ]));

  const resolved = resolvePlan({
    appName,
    framework,
    backend,
    ref: flags.ref,
    verify: flags.verify,
    cwd: process.cwd(),
  });

  if (!resolved.ok) {
    report(`\n${resolved.reason}`);
    return 1;
  }

  const { plan } = resolved;

  report(`\nGenerating ${plan.appName} — ${plan.framework}${plan.backend === 'nest' ? ' + NestJS + PostgreSQL' : ' (frontend only)'}`);

  const result = scaffold(plan, report);

  if (plan.verify) {
    report('\nVerifying the generated project:');

    const results = verify(result.parts, report);
    const failed = results.filter((step) => !step.ok);

    for (const step of failed) {
      report(`\n✗ ${step.part}: ${step.step}\n${step.detail ?? ''}`);
    }

    if (failed.length > 0) {
      report(`\n${String(failed.length)} step(s) failed. The project was generated but does not pass its own checks.`);
      return 1;
    }

    report(`\nAll ${String(results.length)} steps passed.`);
  }

  report(`\nDone: ${result.directory}`);
  report('No git history was copied, and no repository was initialised — run `git init` when you are ready.');

  if (plan.backend === 'nest') {
    report('\nThe server needs its database before it will answer:');
    report('  cd server && npm run db:up && npm run prisma:migrate');
    report('A JWT_SECRET was generated into server/.env. It is gitignored; keep it that way.');
  }

  return 0;
}

main().then(
  (code) => {
    exit(code);
  },
  (error: unknown) => {
    report(`\n${error instanceof Error ? error.message : String(error)}`);
    exit(1);
  },
);
