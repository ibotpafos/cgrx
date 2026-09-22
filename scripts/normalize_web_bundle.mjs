import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../crates/cgrx-cli/web/app.js", import.meta.url);
const source = await readFile(path, "utf8");
const normalized = source
  .replace(/[ \t]+$/gm, "")
  .replace(/^ +(?=\t)/gm, "");

if (normalized !== source) await writeFile(path, normalized);
