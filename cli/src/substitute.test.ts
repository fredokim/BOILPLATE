import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { frontendEnv, generateSecret, renamePackage, serverEnv, setEnv } from './substitute';
import { resolvePlan, type Plan } from './plan';

function planFor(framework: string, backend: string): Plan {
  const resolved = resolvePlan({ appName: 'shop', framework, backend, cwd: '/tmp' });

  if (!resolved.ok) throw new Error(resolved.reason);

  return resolved.plan;
}

describe('renamePackage', () => {
  /**
   * The three frontends are called `react-boilerplate`, `next-boilerplate` and
   * `boilplate`. A search-and-replace for the repository name would rewrite two
   * of them and silently miss Vue.
   */
  it('sets the name field whatever the old name was', () => {
    for (const old of ['react-boilerplate', 'boilplate', 'next-boilerplate']) {
      const result = renamePackage(`{"name": "${old}", "version": "0.0.0"}`, 'shop');

      assert.equal(JSON.parse(result).name, 'shop');
    }
  });

  it('keeps everything else, including fields it has never heard of', () => {
    const before = { name: 'boilplate', version: '1.2.3', private: true, scripts: { dev: 'vite' }, futureField: [1, 2] };
    const after = JSON.parse(renamePackage(JSON.stringify(before, null, 2), 'shop'));

    assert.deepEqual(after, { ...before, name: 'shop' });
  });

  it('refuses a package.json it cannot parse rather than writing something worse', () => {
    assert.throws(() => renamePackage('{ not json', 'shop'));
  });
});

describe('setEnv', () => {
  it('replaces a value that is already set', () => {
    assert.equal(setEnv('PORT=3000\n', 'PORT', '3001'), 'PORT=3001\n');
  });

  /**
   * The case the whole function exists for. All three frontends ship every
   * variable commented out, so an implementation that only handled "already set"
   * would append a duplicate below the comment and leave a file whose meaning
   * depends on which line you read.
   */
  it('uncomments a commented key in place instead of appending a second one', () => {
    const example = '# Where data comes from.\n# VITE_DATA_MODE=server\n';
    const result = setEnv(example, 'VITE_DATA_MODE', 'server');

    assert.equal(result, '# Where data comes from.\nVITE_DATA_MODE=server\n');
    assert.equal(result.match(/VITE_DATA_MODE/g)?.length, 1);
  });

  it('appends a key that is not mentioned at all', () => {
    assert.equal(setEnv('PORT=1\n', 'NEW', 'x'), 'PORT=1\nNEW=x\n');
  });

  it('does not confuse a key with one that merely starts the same way', () => {
    const result = setEnv('VITE_DATA_MODE_EXTRA=keep\n', 'VITE_DATA_MODE', 'server');

    assert.match(result, /VITE_DATA_MODE_EXTRA=keep/);
    assert.match(result, /^VITE_DATA_MODE=server$/m);
  });
});

describe('frontendEnv', () => {
  /**
   * Nothing is written. Every frontend variable is optional and the commented
   * defaults run the app on MSW; writing `VITE_DATA_MODE=mock` would look like a
   * decision rather than a default.
   */
  it('writes no file for a frontend-only project', () => {
    assert.equal(frontendEnv('# VITE_DATA_MODE=server\n', planFor('react', 'none')), null);
  });

  it('points React and Vue at the local server and switches them off mock data', () => {
    for (const framework of ['react', 'vue']) {
      const env = frontendEnv('# VITE_DATA_MODE=server\n# VITE_API_TARGET=http://127.0.0.1:3001\n', planFor(framework, 'nest'));

      assert.equal(env?.path, '.env');
      assert.match(env?.contents ?? '', /^VITE_DATA_MODE=server$/m);
      assert.match(env?.contents ?? '', /^VITE_API_TARGET=http:\/\/127.0.0.1:3001$/m);
    }
  });

  /** Next reads it server-side and writes `.env.local`; the browser never calls the backend. */
  it('gives Next an unprefixed BACKEND_URL in .env.local', () => {
    const env = frontendEnv('# BACKEND_URL=http://127.0.0.1:3001\n', planFor('next', 'nest'));

    assert.equal(env?.path, '.env.local');
    assert.match(env?.contents ?? '', /^BACKEND_URL=http:\/\/127.0.0.1:3001$/m);
    assert.doesNotMatch(env?.contents ?? '', /NEXT_PUBLIC_BACKEND_URL/);
  });
});

describe('serverEnv', () => {
  const example = 'JWT_SECRET=\nCORS_ORIGINS=http://localhost:5173\nSEED_ADMIN_PASSWORD=\n';

  /**
   * The server refuses to start on a secret under 32 characters and ships with
   * the field empty and no fallback, so this is the difference between a
   * generated project that runs and one that does not.
   */
  it('fills the empty JWT_SECRET with something long enough to be accepted', () => {
    const secret = /^JWT_SECRET=(.+)$/m.exec(serverEnv(example, planFor('react', 'nest')))?.[1] ?? '';

    assert.ok(secret.length >= 32, `secret was ${String(secret.length)} characters`);
  });

  it('generates a different secret every time', () => {
    assert.notEqual(generateSecret(), generateSecret());
  });

  /** Vite dev runs on 5173 and Next on 3000, and the server allows only what it is told. */
  it('allows the dev origin of the framework that was chosen', () => {
    assert.match(serverEnv(example, planFor('react', 'nest')), /^CORS_ORIGINS=.*:5173/m);
    assert.match(serverEnv(example, planFor('next', 'nest')), /^CORS_ORIGINS=.*:3000/m);
  });

  it('leaves no empty required value behind', () => {
    const contents = serverEnv(example, planFor('vue', 'nest'));

    assert.doesNotMatch(contents, /^JWT_SECRET=$/m);
    assert.doesNotMatch(contents, /^SEED_ADMIN_PASSWORD=$/m);
  });
});
