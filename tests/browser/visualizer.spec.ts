// CI functional gate. Real-GPU performance is measured separately; no software-renderer SLO claims.
import { test, expect } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { graphFixture } from '../../crates/cgrx-cli/web/graph-fixtures.js';
let server: ReturnType<typeof spawn>, root: string, url: string;
test.beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'cgrx-browser-'));
  const git = (...args: string[]) => execFileSync('git', ['-C', root, ...args]);
  git('init', '-q'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'CGRX fixture');
  writeFileSync(join(root, 'main.rs'), 'fn target() {}\nfn caller() { target(); }'); git('add', '.'); git('commit', '-qm', 'fixture');
  server = spawn(process.env.CGRX_BINARY || 'target/debug/cgrx', ['visualize', '--root', root, '--projects-dir', root, '--no-open']);
  url = await new Promise((resolve, reject) => { server.stdout!.on('data', chunk => { const match = String(chunk).match(/visualizer_url=(\S+)/); if (match) resolve(match[1]); }); server.once('error', reject); server.once('exit', code => reject(Error(`server exited ${code}`))); });
});
test.afterAll(() => { server?.kill(); if (root) rmSync(root, { recursive: true, force: true }); });
test('real backend: project graph, keyboard search, 3D and lazy panels under CSP', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page.locator('.project-sigma')).toHaveAttribute('data-rendered-nodes', '2');
  await expect(page.getByRole('button', { name: '3D', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.locator('.project-three-canvas')).toHaveAttribute('data-rendered-nodes', '2');
  await expect(page.locator('.project-three-canvas')).toHaveAttribute('data-rendered-edges', '1');
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.locator('.project-sigma')).toHaveAttribute('data-rendered-edges', '1');
  await page.locator('#search-input').fill('caller');
  await page.locator('#search-input').press('Enter');
  await page.locator('summary').filter({ hasText: 'Matches' }).click();
  await expect(page.getByText('caller', { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
test('20k/120k string IDs and parallel edges reach renderer without truncation', async ({ page }) => {
  const fixture = graphFixture(20000);
  await page.route('**/api/repository-graph?**', route => route.fulfill({ json: fixture }));
  await page.goto(url);
  await expect(page.locator('.project-sigma')).toHaveAttribute('data-rendered-nodes', '20000', { timeout: 90000 });
  await expect(page.locator('.project-sigma')).toHaveAttribute('data-rendered-edges', '120000', { timeout: 90000 });
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.locator('.project-three-canvas')).toHaveAttribute('data-rendered-edges', '120000', { timeout: 90000 });
  expect(Number(await page.locator('.project-three-canvas').getAttribute('data-textures'))).toBeLessThanOrEqual(32);
});
test('context loss falls back to explicitly bounded SVG', async ({ page }) => {
  await page.route('**/api/repository-graph?**', route => route.fulfill({ json: graphFixture(1000) }));
  await page.goto(url);
  await expect(page.locator('.project-sigma')).toHaveAttribute('data-rendered-nodes', '1000');
  await page.locator('.project-sigma canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(page.getByText(/SVG fallback limited to 500 nodes/)).toBeVisible();
  await expect(page.locator('.map-node')).toHaveCount(500);
});
