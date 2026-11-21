import { createHash } from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
const shared = "src/components/ui/";
const controls = new Set([
  "button",
  "input",
  "textarea",
  "select",
  "table",
  "progress",
]);
const implementations = {
  button: "button",
  input: "input",
  textarea: "textarea",
  table: "table",
  progress: "progress",
  select: "select",
};
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const files = (ref) =>
  (ref
    ? git("ls-tree", "-rz", "--name-only", ref, "--", "src")
    : git(
        "ls-files",
        "-z",
        "--cached",
        "--others",
        "--exclude-standard",
        "--",
        "src"
      )
  )
    .split("\0")
    .filter(
      (p) =>
        /\.[jt]sx$/.test(p) &&
        !/\.(spec|test|stories)\./.test(p) &&
        (ref || fs.existsSync(p))
    );

function inspect(file, source) {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const exports = new Set();
  const symbols = {};
  const uses = {};
  const violations = {};
  const inputs = {};
  const rawUses = [];
  for (const stmt of ast.statements) {
    if (
      ts.isExportDeclaration(stmt) &&
      stmt.exportClause &&
      ts.isNamedExports(stmt.exportClause)
    ) {
      for (const e of stmt.exportClause.elements)
        if (!e.isTypeOnly && !stmt.isTypeOnly) exports.add(e.name.text);
    }
  }
  function visit(node, owner) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isVariableDeclaration(node) ||
      ts.isClassDeclaration(node)
    ) {
      const name = node.name?.getText(ast);
      if (
        name &&
        /^[A-Z][A-Za-z0-9]*$/.test(name) &&
        (ts.isClassDeclaration(node)
          ? /extends\s+(React\.)?(Pure)?Component\b/.test(node.getText(ast))
          : /<[A-Za-z>]|\.forwardRef\b|\b(?:memo|forwardRef|createElement)\s*[(<]|:\s*(?:React\.)?FC\b/.test(
              node.getText(ast)
            ))
      ) {
        owner = name;
        symbols[name] =
          ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
        if (ts.isFunctionDeclaration(node)) {
          inputs[name] = node.parameters
            .map((p) => p.getText(ast).replace(/\s+/g, " "))
            .join(", ");
        } else if (
          ts.isVariableDeclaration(node) &&
          node.initializer &&
          ts.isCallExpression(node.initializer)
        ) {
          inputs[name] =
            node.initializer.typeArguments
              ?.map((t) => t.getText(ast))
              .join(", ") || "";
        }
        const statement = ts.isVariableDeclaration(node)
          ? node.parent.parent
          : node;
        if (
          statement.modifiers?.some(
            (m) => m.kind === ts.SyntaxKind.ExportKeyword
          )
        )
          exports.add(name);
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = node.tagName.getText(ast);
      uses[name] = (uses[name] || 0) + 1;
      if (
        controls.has(name) &&
        file !== shared + implementations[name] + ".tsx" &&
        !(name === "select" && file === shared + "native-select.tsx")
      ) {
        rawUses.push({
          control: name,
          line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
          fingerprint: createHash("sha256").update(owner + "/" + node.getText(ast)).digest("hex"),
        });
        const key = owner + "/" + name;
        violations[key] = (violations[key] || 0) + 1;
      }
    }
    ts.forEachChild(node, (child) => visit(child, owner));
  }
  visit(ast, "(module)");
  return {
    symbols,
    inputs,
    public: [...exports].filter((s) => /^[A-Z]/.test(s)).sort(),
    uses,
    violations,
    rawUses,
  };
}
function scan(ref) {
  return Object.fromEntries(
    files(ref).map((file) => [
      file,
      inspect(
        file,
        ref ? git("show", ref + ":" + file) : fs.readFileSync(file, "utf8")
      ),
    ])
  );
}
const revision = process.argv.indexOf("--revision");
const current = scan(revision >= 0 ? process.argv[revision + 1] : undefined);
const decisionPath = "quality/components/decisions.json";
const decisions = fs.existsSync(decisionPath)
  ? JSON.parse(fs.readFileSync(decisionPath, "utf8"))
  : {};
const registry = JSON.parse(
  fs.readFileSync("quality/components/library.json", "utf8")
);
const errors = [];
const fixturePath = "quality/components/specimens.tsx";
const exampleKeys = new Set();
if (fs.existsSync(fixturePath)) {
  const ast = ts.createSourceFile(
    fixturePath,
    fs.readFileSync(fixturePath, "utf8"),
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  );
  function collectExamples(node) {
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression))
      exampleKeys.add(node.expression.text);
    ts.forEachChild(node, collectExamples);
  }
  collectExamples(ast);
}
for (const file of new Set([
  ...Object.keys(current).filter((f) => f.startsWith(shared)),
  ...Object.keys(registry),
])) {
  const item = registry[file];
  if (item) {
    const key = file
      .split("/")
      .pop()
      .replace(/\.tsx$/, "");
    if (!exampleKeys.has(key)) {
      errors.push("Add an interactive web specimen for " + file);
    }
  }
  if (
    !current[file] ||
    !item ||
    !item.purpose?.trim() ||
    !item.family?.trim() ||
    JSON.stringify(current[file].public) !== JSON.stringify(item.symbols)
  )
    errors.push("Register shared exports and usage guidance for " + file);
}
const at = process.argv.indexOf("--base");
if (at >= 0) {
  const ref = process.argv[at + 1];
  if (!ref) throw Error("--base requires a Git revision");
  const previous = scan(ref);
  for (const [file, entry] of Object.entries(current)) {
    for (const symbol of Object.keys(entry.symbols)) {
      if (previous[file]?.symbols[symbol]) continue;
      const note = decisions[file + "#" + symbol];
      if (
        !["purpose", "closest", "gap", "consumer", "verification"].every(
          (field) => typeof note?.[field] === "string" && note[field].trim()
        )
      ) {
        errors.push(
          file +
            "#" +
            symbol +
            " needs a component decision in quality/components/decisions.json"
        );
      }
    }

  }
}
const reviewPath = "quality/components/control-review.json";
const review = JSON.parse(revision >= 0 ? git("show", process.argv[revision + 1] + ":" + reviewPath) : fs.readFileSync(reviewPath, "utf8"));
const audit = JSON.parse(execFileSync("python3", ["scripts/control_review.py"], {
  input: JSON.stringify({ review, files: current, registry, cohort_digest: "0485294bc3c7557f8df39a1b3f171e6cfe1202b2a60213479c76a65ce4c8101a" }),
  encoding: "utf8", maxBuffer: 16 * 1024 * 1024
}));
errors.push(...audit.errors);
if (process.argv.includes("--json"))
  console.log(JSON.stringify({ audit, registry, decisions, files: current, errors }));
else
  console.log(
    errors.length
      ? errors.join("\n")
      : "Web component inventory and requested reuse checks passed."
  );
process.exitCode = errors.length ? 1 : 0;
