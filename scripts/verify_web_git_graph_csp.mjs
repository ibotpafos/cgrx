import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const bundle = readFileSync("crates/cgrx-cli/web/vendor/web-git-graph.js", "utf8");
const startMarker = "=`\n:host {";
const endMarker = "`;function A(";
const start = bundle.indexOf(startMarker);
const end = bundle.indexOf(endMarker, start + startMarker.length);
if (start < 0 || end < 0) throw new Error("web-git-graph embedded stylesheet not found");
const rawTemplate = bundle.slice(start + 2, end);
const stylesheet = Function(`"use strict"; return \`${rawTemplate}\`;`)();
const digest = createHash("sha256").update(stylesheet).digest("base64");
const policy = readFileSync("crates/cgrx-cli/src/visualize/http.rs", "utf8");
const source = `'sha256-${digest}'`;
if (!policy.includes(source)) {
  throw new Error(`visualizer CSP must allow the bundled stylesheet with ${source}`);
}
console.log(`verified web-git-graph CSP ${source}`);
