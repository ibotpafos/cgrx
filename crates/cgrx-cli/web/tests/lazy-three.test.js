import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

// Exercise the shipping build command: dropping its external flag eagerly bundles Three again.
test('startup build excludes Three and keeps the fixed local lazy import', async () => {
  const { scripts } = JSON.parse(await readFile(new URL('../../../../package.json', import.meta.url), 'utf8'));
  const command = scripts['build:web'].split(' && ')[0];
  const args = command.slice('esbuild '.length).split(' ').filter(arg => !arg.startsWith('--outfile='));
  const { outputFiles, metafile } = await build({
    entryPoints: [args[0]], bundle: true, format: 'esm', target: 'es2024', minify: true,
    external: args.filter(arg => arg.startsWith('--external:')).map(arg => arg.slice('--external:'.length)),
    write: false, metafile: true,
  });
  assert.equal(Object.keys(metafile.inputs).some(path => path.includes('node_modules/three/')), false);
  assert.match(outputFiles[0].text, /import\(["']\.\/project-three\.js["']\)/);
});
