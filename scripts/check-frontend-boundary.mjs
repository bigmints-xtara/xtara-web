import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const allowed = new Set([
  path.normalize('src/lib/firebase-client.ts'),
  path.normalize('src/lib/firebase/firebase.ts'),
  path.normalize('src/lib/firebase/server.ts'),
]);

const forbidden = [
  /from\s+['"]firebase\/firestore['"]/,
  /from\s+['"]firebase\/functions['"]/,
  /\bgetFirestore\s*\(/,
  /\bgetFunctions\s*\(/,
  /\bcollection\s*\(\s*db\b/,
  /\bdoc\s*\(\s*db\b/,
  /\bgetDocs\s*\(/,
  /\bgetDoc\s*\(/,
  /\bsetDoc\s*\(/,
  /\bupdateDoc\s*\(/,
  /\bdeleteDoc\s*\(/,
  /\bonSnapshot\s*\(/,
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(filePath);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    return [filePath];
  });
}

const violations = [];

for (const file of walk(root)) {
  const normalized = path.normalize(path.relative(process.cwd(), file));
  if (allowed.has(normalized)) continue;

  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      violations.push(`${file}: forbidden frontend data-boundary pattern "${pattern}"`);
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
