import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import pandinoBundle from '../index';

async function mkdtemp(prefix = 'pandino-plugin-test-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function writeFile(file: string, content: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

function makePlugin(options: Parameters<typeof pandinoBundle>[0]) {
  const plugin = pandinoBundle(options);
  // minimal rollup plugin context mock
  const ctx: any = {
    emitFile: (_file: any) => {},
    parse: undefined,
    error: (e: any) => {
      throw e;
    },
    warn: (_message: any) => {},
  };
  return { plugin, ctx };
}

async function generateBundleCode(rootDir: string, opts: Parameters<typeof pandinoBundle>[0] = {}) {
  const { plugin, ctx } = makePlugin({ rootDir, ...opts });
  // call options to init normalizedInput if needed
  await (plugin.options as any).call(ctx, {});
  // buildStart triggers scan
  await (plugin.buildStart as any).call(ctx);
  const id = (plugin.resolveId as any).call(ctx, 'pandino:bundle');
  const code = await (plugin.load as any).call(ctx, 'pandino:bundle');
  return { id, code: String(code) };
}

describe('pandinoBundle plugin', () => {
  let tmp: string;

  beforeAll(async () => {
    tmp = await mkdtemp();
  });

  afterAll(async () => {
    // best-effort cleanup
    try {
      await fs.rm(tmp, { recursive: true, force: true });
    } catch {}
  });

  it('generates module with headers from package.json and discovered components (named and namespace decorators)', async () => {
    await writeFile(path.join(tmp, 'package.json'), JSON.stringify({ name: 'test-bundle', version: '1.2.3' }, null, 2));

    const fileA = path.join(tmp, 'src', 'a.ts');
    const codeA = `
      import { Component } from '@pandino/decorators';
      @Component()
      export class A {}
    `;
    await writeFile(fileA, codeA);

    const fileB = path.join(tmp, 'src', 'b.ts');
    const codeB = `
      import * as Decorators from '@pandino/decorators';
      @Decorators.Component()
      export default class B {}
    `;
    await writeFile(fileB, codeB);

    const activator = path.join(tmp, 'src', 'Activator.ts');
    const activatorCode = `export default class Activator {}`;
    await writeFile(activator, activatorCode);

    const { code } = await generateBundleCode(tmp, { activator: 'src/Activator.ts' });

    expect(code).toMatchSnapshot();
  });

  it('respects include/exclude globs to skip files', async () => {
    await writeFile(
      path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'test-bundle-2', version: '0.0.1' }, null, 2),
    );

    const excluded = path.join(tmp, 'build', 'x.ts');
    await writeFile(excluded, `import { Component } from '@pandino/decorators'; @Component() export class X {}`);

    const included = path.join(tmp, 'src', 'y.ts');
    await writeFile(included, `import { Component } from '@pandino/decorators'; @Component() export class Y {}`);

    const { code } = await generateBundleCode(tmp, { include: ['src/**/*.ts'], exclude: ['**/build/**'] });

    expect(code).toMatchSnapshot();
  });

  it('allows overriding headers via options', async () => {
    await writeFile(
      path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'ignored-name', version: '9.9.9' }, null, 2),
    );
    const { code } = await generateBundleCode(tmp, { headers: { bundleSymbolicName: 'over', bundleVersion: '1.0.0' } });
    expect(code).toMatchSnapshot();
  });
});
