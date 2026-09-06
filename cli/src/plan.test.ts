import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normaliseAppName, partsOf, resolvePlan } from './plan';

const base = { appName: 'my-app', framework: 'react', backend: 'nest', cwd: '/tmp' };

const plan = (over: Partial<typeof base> & { database?: string } = {}) => resolvePlan({ ...base, ...over });

describe('normaliseAppName', () => {
  it('takes the last path segment, so `create-fredo-app ./apps/shop` names the app', () => {
    assert.equal(normaliseAppName('./apps/shop'), 'shop');
    assert.equal(normaliseAppName('C:\\work\\Shop'), 'shop');
  });

  it('turns what people type into what npm accepts', () => {
    assert.equal(normaliseAppName('My Shop'), 'my-shop');
    assert.equal(normaliseAppName('myShop'), 'my-shop');
    assert.equal(normaliseAppName('my_shop'), 'my-shop');
  });
});

describe('resolvePlan', () => {
  it('accepts each of the four MVP combinations', () => {
    for (const framework of ['react', 'next', 'vue']) {
      assert.equal(plan({ framework }).ok, true);
      assert.equal(plan({ framework, backend: 'none' }).ok, true);
    }
  });

  /**
   * Not a preference. The server's Prisma client is generated from a Postgres
   * schema and its config validation requires DATABASE_URL, so this combination
   * generates a project that does not start.
   */
  it('refuses a backend without its database, and says why', () => {
    const result = plan({ database: 'none' });

    assert.equal(result.ok, false);
    assert.match(String(result.ok === false && result.reason), /Prisma schema and config validation/);
  });

  it('refuses a database without a backend', () => {
    const result = plan({ backend: 'none', database: 'postgres' });

    assert.equal(result.ok, false);
    assert.match(String(result.ok === false && result.reason), /nothing to talk to it/);
  });

  it('names the options instead of failing silently on a typo', () => {
    const result = plan({ framework: 'svelte' });

    assert.equal(result.ok === false && result.reason, 'Unknown framework "svelte". Choose one of: react, next, vue.');
  });

  /**
   * A name npm rejects fails at `npm install`, which is several hundred files
   * after the point where it could have been a sentence.
   */
  it('rejects a name npm would reject', () => {
    assert.equal(plan({ appName: 'My App!' }).ok, false);
    assert.equal(plan({ appName: '   ' }).ok, false);
  });

  it('defaults the template ref to main', () => {
    const result = plan();

    assert.equal(result.ok && result.plan.ref, 'main');
  });
});

describe('partsOf', () => {
  it('is one part with no backend and two with one', () => {
    const frontendOnly = plan({ backend: 'none' });
    const withServer = plan();

    assert.deepEqual(frontendOnly.ok && partsOf(frontendOnly.plan).map((part) => part.dir), ['frontend']);
    assert.deepEqual(withServer.ok && partsOf(withServer.plan).map((part) => part.dir), ['frontend', 'server']);
  });

  it('names the server after the app, so two generated projects do not collide', () => {
    const result = plan({ appName: 'shop' });

    assert.deepEqual(result.ok && partsOf(result.plan).map((part) => part.name), ['shop', 'shop-server']);
  });
});
