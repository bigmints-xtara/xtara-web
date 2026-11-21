import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { cp, copyFile, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export async function localPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

export function processWithLog(cmd, args, cwd, env, logFile) {
  const log = createWriteStream(logFile, { flags: 'wx' });
  const child = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  child.on('exit', () => log.end());
  return child;
}

export async function waitFor(child, label, probe) {
  const until = Date.now() + 120000;
  while (Date.now() < until) {
    if (child.exitCode !== null || child.signalCode) throw new Error(label + ' exited before becoming ready.');
    const value = await probe().catch(() => null);
    if (value) return value;
    await delay(250);
  }
  throw new Error(label + ' timed out.');
}

export async function prepareWeb(root, temp) {
  const dir = path.join(temp, 'web');
  await mkdir(dir);
  await cp(path.join(root, 'src'), path.join(dir, 'src'), { recursive: true });
  for (const name of ['package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs']) {
    await copyFile(path.join(root, name), path.join(dir, name));
  }
  for (const name of ['node_modules', 'public']) await symlink(path.join(root, name), path.join(dir, name), 'dir');
  const fixtureAuth = await readFile(new URL('./fixture-auth.txt', import.meta.url), 'utf8');
  await writeFile(path.join(dir, 'src/lib/firebase-client.ts'), fixtureAuth);
  const authContext = path.join(dir, 'src/context/AuthContext.tsx');
  await replace(authContext, 'import { onAuthStateChanged, type User } from "firebase/auth";',
    'import type { User } from "firebase/auth";\nimport { onAuthStateChanged } from "@/lib/firebase-client";');
  // Match production Inter even when the rendering worker cannot reach Google Fonts.
  await copyFile(path.join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'), path.join(dir, 'src/app/render-inter.woff2'));
  const layout = path.join(dir, 'src/app/layout.tsx');
  await replace(layout, 'import { Inter } from "next/font/google";', 'import localFont from "next/font/local";');
  await replace(layout, 'Inter({ subsets: ["latin"], variable: "--font-inter" })',
    'localFont({ src: "./render-inter.woff2", weight: "100 900", variable: "--font-inter" })');
  await replace(path.join(dir, 'next.config.ts'), 'const nextConfig: NextConfig = {', 'const nextConfig: NextConfig = {\n  devIndicators: false,');
  return dir;
}

async function replace(file, from, to) {
  const source = await readFile(file, 'utf8');
  assert(source.includes(from), 'Render boundary changed in ' + path.basename(file));
  await writeFile(file, source.replace(from, to));
}
