// Independent symbol identities from the official TypeScript compiler API.
// Invoke with an isolated SDK path, a frozen case manifest, and a new output path.
// The product parser, serialized facts, and CGRX resolver are never imported.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [sdk, manifestPath, outputPath] = process.argv.slice(2);
if (!sdk || !manifestPath || !outputPath) throw new Error('SDK, manifest, output required');
const ts = require(path.resolve(sdk));
const manifestBytes = fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const byteSpan = (file, start, end) => [
  Buffer.byteLength(file.text.slice(0, start)), Buffer.byteLength(file.text.slice(0, end)),
];
const relative = (root, file) => path.relative(root, file).split(path.sep).join('/');
const results = [];
const diagnosticsByGroup = [];
for (const group of manifest.groups) {
  const root = path.resolve(group.root);
  const options = {
    noEmit: true, strict: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX, skipLibCheck: true, experimentalDecorators: true,
    ...group.options,
  };
  const program = ts.createProgram(group.files.map(file => path.join(root, file)), options);
  const checker = program.getTypeChecker();
  const semantic = program.getSemanticDiagnostics();
  diagnosticsByGroup.push({root, syntactic_count: program.getSyntacticDiagnostics().length,
    semantic_count: semantic.length, semantic_codes: [...new Set(semantic.map(d => d.code))].sort((a,b) => a-b)});
  for (const test of group.cases) {
    const file = program.getSourceFile(path.join(root, test.path));
    if (!file) throw new Error(`missing compiler source: ${test.id}`);
    const raw = Buffer.from(file.text);
    if (test.source_sha256 && sha256(raw) !== test.source_sha256) throw new Error(`source drift: ${test.id}`);
    let found;
    function visit(node) {
      const span = byteSpan(file, node.getStart(file), node.getEnd());
      if (ts.isIdentifier(node) && span[0] === test.site[0] && span[1] === test.site[1]) found = node;
      ts.forEachChild(node, visit);
    }
    visit(file);
    if (!found) throw new Error(`site is not one compiler identifier: ${test.id}`);
    let symbol = checker.getSymbolAtLocation(found);
    const alias = Boolean(symbol && (symbol.flags & ts.SymbolFlags.Alias));
    if (alias) symbol = checker.getAliasedSymbol(symbol);
    const declarations = (symbol?.declarations || []).map(declaration => {
      const targetFile = declaration.getSourceFile();
      const name = declaration.name;
      return {
        path: relative(root, targetFile.fileName), kind: ts.SyntaxKind[declaration.kind],
        name: name?.getText(targetFile) || null,
        span: name ? byteSpan(targetFile, name.getStart(targetFile), name.getEnd()) : null,
        source_sha256: sha256(Buffer.from(targetFile.text)),
      };
    });
    const diagnostics = semantic.filter(diagnostic => diagnostic.file === file
      && diagnostic.start !== undefined && diagnostic.start < found.getEnd()
      && diagnostic.start + (diagnostic.length || 0) > found.getStart(file)).map(d => d.code);
    const expected = test.expected_identity;
    const matches = test.expected_no_declaration ? declarations.length === 0 : expected === undefined ? null : declarations.length === 1
      && declarations[0].path === expected.path && declarations[0].name === expected.name
      && JSON.stringify(declarations[0].span) === JSON.stringify(expected.span);
    results.push({id: test.id, path: test.path, site: test.site, alias,
      source_sha256: sha256(raw), symbol: symbol?.getName() || null,
      symbol_flags: symbol?.flags || 0, declarations, diagnostics, expected_identity_matches: matches});
  }
}
const output = {
  compiler_version: ts.version, compiler_api: 'createProgram/getSymbolAtLocation/getAliasedSymbol',
  manifest_sha256: sha256(manifestBytes), results,
  diagnostics_by_group: diagnosticsByGroup,
};
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
const mismatch = results.filter(r => r.expected_identity_matches === false);
console.log(JSON.stringify({compiler: ts.version, cases: results.length, identity_mismatches: mismatch.map(r => r.id)}));
if (mismatch.length) process.exitCode = 1;
