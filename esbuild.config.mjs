import esbuild from "esbuild";
import process from "node:process";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Output directory (default to root for submission)
let VAULT_PLUGIN_DIR = "./";

// Load local settings if they exist (for automatic vault sync during development)
try {
  if (fs.existsSync("./local.settings.json")) {
    const settings = JSON.parse(fs.readFileSync("./local.settings.json", "utf8"));
    if (settings.vaultPath) {
      VAULT_PLUGIN_DIR = settings.vaultPath;
    }
  }
} catch (e) {
  // Fallback to local root if anything fails
  VAULT_PLUGIN_DIR = "./";
}

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtinModules,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: `${VAULT_PLUGIN_DIR}/main.js`,
  minify: prod,
  jsx: "automatic",
});

// manifest.json and styles.css copy logic

const copyStatics = () => {
  const files = ["manifest.json", "styles.css"];
  for (const f of files) {
    if (fs.existsSync(f)) {
      const dest = path.join(VAULT_PLUGIN_DIR, f);
      if (path.resolve(f) !== path.resolve(dest)) {
        fs.copyFileSync(f, dest);
      }
    }
  }
};

if (prod) {
  await context.rebuild();
  copyStatics();
  process.exit(0);
} else {
  await context.watch();
  copyStatics();
}
