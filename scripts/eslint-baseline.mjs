import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const baselinePath = resolve(root, "quality/eslint-baseline.json");
const update = process.argv.includes("--update");
const result = spawnSync(resolve(root, "node_modules/.bin/eslint"), [".", "--format", "json"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (result.error) throw result.error;
let reports;
try {
  reports = JSON.parse(result.stdout || "[]");
} catch {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(2);
}

const counts = {};
let errors = 0;
let warnings = 0;
for (const report of reports) {
  const file = relative(root, report.filePath).replaceAll("\\", "/");
  for (const message of report.messages) {
    if (message.severity === 2) errors += 1;
    if (message.severity === 1) warnings += 1;
    const key = `${message.severity}|${message.ruleId || "parser"}|${file}`;
    counts[key] = (counts[key] || 0) + 1;
  }
}

if (update) {
  mkdirSync(resolve(root, "quality"), { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify({ version: 1, errors, warnings, diagnostics: counts }, null, 2)}\n`);
  console.log(`Updated ESLint baseline: ${errors} errors, ${warnings} warnings.`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const regressions = Object.entries(counts).filter(([key, count]) => count > (baseline.diagnostics[key] || 0));
if (regressions.length) {
  console.error("ESLint regressions exceed the committed baseline:");
  for (const [key, count] of regressions) {
    console.error(`  ${key}: ${count} (baseline ${baseline.diagnostics[key] || 0})`);
  }
  process.exit(1);
}

console.log(`ESLint regression gate passed (${errors} existing errors, ${warnings} existing warnings; no increases).`);
