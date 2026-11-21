// Build a classic script so the interactive examples also work from file://.
import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.argv[2]);
mkdirSync(out, { recursive: true });
const entry = resolve(root, "quality/components/specimens.tsx");
await build({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    outDir: out,
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry,
      name: "XtaraExamples",
      formats: ["iife"],
      fileName: () => "web.js",
    },
  },
});
const file = resolve(root, "src/app/globals.css");
// Only collect utilities for the specimen and the actual UI implementations.
const source = readFileSync(file, "utf8")
  .replace(
    '@import "tailwindcss";',
    '@import "tailwindcss" source(none);\n@source "../components/ui";\n@source "../../quality/components/specimens.tsx";'
  )
  .replace('@import "./indic-fonts.css";', "");
const css = await postcss([
  tailwind({ base: dirname(file), optimize: true }),
]).process(source, { from: file, to: resolve(out, "web.css") });
writeFileSync(resolve(out, "web.css"), css.css);
