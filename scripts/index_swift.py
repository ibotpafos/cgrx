#!/usr/bin/env python3
"""Produce source-bound Swift compiler evidence without running the application.

Uses a prepared SwiftPM description, but compiles every selected module into a
fresh private IndexStore. Old append-only build stores are never imported.
Only the producing toolchain's public libIndexStore C API is used (no packages).
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

from swift_indexstore import read as read_indexstore


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def inventory(repo, roots):
    result = set()
    for relative in roots:
        base = repo / relative
        if not base.is_dir() or base.is_symlink():
            raise ValueError(f'invalid source root: {relative}')
        for directory, dirs, files in os.walk(base, followlinks=False):
            if any((Path(directory) / name).is_symlink() for name in dirs + files):
                raise ValueError('symlinks in a source root are unsupported')
            for name in files:
                if name.endswith('.swift'):
                    result.add(str((Path(directory) / name).relative_to(repo)))
            if len(result) > 10000:
                raise ValueError('source inventory exceeds 10000 Swift files')
    return result


def semantic_arguments(arguments):
    # Retain semantic options, conditional defines, plugins, target and SDK.
    # Redirect all compiler outputs and caches to the explicitly supplied workdir.
    singles = {'-incremental', '-enable-batch-mode', '-serialize-diagnostics',
               '-parseable-output', '-emit-objc-header'}
    pairs = {'-index-store-path', '-module-cache-path', '-emit-objc-header-path',
             '-output-file-map', '-o', '-emit-module-path', '-serialize-diagnostics-path'}
    result = []
    cursor = 0
    while cursor < len(arguments):
        argument = arguments[cursor]
        if argument in ('-Xcc', '-Xfrontend'):
            if cursor + 1 >= len(arguments):
                raise ValueError('missing forwarded compiler argument')
            result.extend(arguments[cursor:cursor + 2])
            cursor += 2
        elif argument in pairs:
            cursor += 2
        elif argument in singles or (argument.startswith('-j') and argument[2:].isdigit()):
            cursor += 1
        else:
            result.append(argument)
            cursor += 1
    return result


def ordered_modules(description, repo, members):
    modules = {c['moduleName']: c for c in description['swiftCommands'].values()
               if any(str(Path(s).relative_to(repo)) in members for s in c['sources']
                      if Path(s).is_relative_to(repo))}
    ordered = []
    pending = dict(modules)
    while pending:
        ready = []
        for name, command in pending.items():
            dependencies = {Path(x['name']).stem for x in command['inputs']
                            if x['kind'] == 'file' and x['name'].endswith('.swiftmodule')}
            if not (dependencies & pending.keys()):
                ready.append(name)
        if not ready:
            raise ValueError('cyclic Swift module dependencies')
        for name in sorted(ready):
            ordered.append(pending.pop(name))
    compiled = {str(Path(s).relative_to(repo)) for c in ordered for s in c['sources']
                if Path(s).is_relative_to(repo)}
    if members - compiled:
        raise ValueError(f'SwiftPM description omits {len(members - compiled)} source files; refresh the build plan')
    return ordered


def produce(repo, description_path, roots, workdir, module_cache, output):
    repo = repo.resolve(strict=True)
    git_root = Path(subprocess.check_output(['git', '-C', str(repo), 'rev-parse', '--show-toplevel'], text=True).strip()).resolve()
    if repo != git_root:
        raise ValueError('--repo must be the canonical Git worktree root')
    if any(Path(r).is_absolute() or '..' in Path(r).parts or r in ('', '.') for r in roots):
        raise ValueError('source roots must be relative subdirectories')
    workdir.mkdir(parents=True, exist_ok=True)
    module_cache.mkdir(parents=True, exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix='swift-index-', dir=workdir))
    modules_dir = run / 'modules'
    modules_dir.mkdir()
    temporary = run / 'tmp'
    temporary.mkdir()
    env = dict(os.environ, TMPDIR=str(temporary), XDG_CACHE_HOME=str(workdir / 'xdg'),
               CLANG_MODULE_CACHE_PATH=str(module_cache), SWIFTPM_MODULECACHE_OVERRIDE=str(module_cache))
    swiftc = Path(subprocess.check_output(['xcrun', '--find', 'swiftc'], text=True, env=env).strip())
    library = swiftc.parent.parent / 'lib/libIndexStore.dylib'
    toolchain = subprocess.check_output([str(swiftc), '--version'], text=True, env=env).strip()
    members = inventory(repo, roots)
    description = json.loads(description_path.read_text())
    modules = ordered_modules(description, repo, members)
    if not modules:
        raise ValueError('no SwiftPM modules match the source inventory')
    source_paths = {Path(s) for c in modules for s in c['sources']}
    if any(not p.is_relative_to(repo) or p.is_symlink() for p in source_paths):
        raise ValueError('external or symlinked source inputs are unsupported')
    sources = {str(p.relative_to(repo)): p.read_bytes().decode('utf-8') for p in sorted(source_paths)}
    input_paths = {description_path.resolve(), swiftc.resolve(), library.resolve()}
    input_paths.update(p for p in (repo / 'Package.swift', repo / 'Package.resolved') if p.is_file())
    module_names = {c['moduleName'] for c in modules}
    commands = []
    for command in modules:
        args = semantic_arguments(command['otherArguments'])
        for i, arg in enumerate(args[:-1]):
            if arg == '-sdk':
                settings = Path(args[i + 1]) / 'SDKSettings.json'
                if settings.is_file():
                    input_paths.add(settings.resolve())
        for dependency in command['inputs']:
            path = Path(dependency['name'])
            if dependency['kind'] != 'file' or path in source_paths:
                continue
            if path.suffix == '.swiftmodule' and path.stem in module_names:
                continue  # Recompiled into the private modules directory below.
            if path.is_file():
                input_paths.add(path.resolve())
        commands.append([str(swiftc), '-emit-module', '-module-name', command['moduleName'],
                         '-I', str(modules_dir), '-I', command['importPath'], *args,
                         '-j2', '-module-cache-path', str(module_cache),
                         '-index-store-path', str(run / 'index'), '-index-include-locals',
                         *command['sources'], '-emit-module-path',
                         str(modules_dir / (command['moduleName'] + '.swiftmodule'))])
    inputs = {str(p): digest(p) for p in sorted(input_paths)}
    for command in commands:
        print('Indexing ' + command[command.index('-module-name') + 1], flush=True)
        with (run / (command[command.index('-module-name') + 1] + '.log')).open('wb') as log:
            subprocess.run(command, cwd=repo, env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
    native = read_indexstore(run / 'index', repo, library)
    observed = {o['path'] for o in native['occurrences']}
    if members - observed:
        raise ValueError('compiler IndexStore omitted source records')
    if inventory(repo, roots) != members or any((repo / p).read_bytes().decode('utf-8') != text for p, text in sources.items()) or any(digest(p) != value for p, value in inputs.items()):
        raise ValueError('sources, membership or compiler inputs changed during indexing; output was not published')
    payload = dict(schema=1, repo=str(repo), toolchain=toolchain,
                   configuration=commands, inventory_roots=roots,
                   sources=sources, inputs=inputs, occurrences=native['occurrences'])
    encoded = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    if len(encoded) > 32 * 1024 * 1024:
        raise ValueError('compiler evidence exceeds 32 MiB')
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, staged = tempfile.mkstemp(prefix='.swift-compiler-', dir=output.parent)
    try:
        with os.fdopen(descriptor, 'wb') as stream:
            stream.write(encoded)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(staged, output)
    finally:
        Path(staged).unlink(missing_ok=True)
    print(json.dumps(dict(output=str(output), sources=len(sources), occurrences=len(native['occurrences']), toolchain=toolchain, build_directory=str(run)), ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--description', type=Path, required=True, help='current SwiftPM debug/description.json')
    parser.add_argument('--source-root', action='append', default=None, help='inventory subdirectory (default Sources)')
    parser.add_argument('--work-dir', type=Path, required=True)
    parser.add_argument('--module-cache', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if not args.work_dir.is_absolute() or not args.module_cache.is_absolute():
        parser.error('work-dir and module-cache must be absolute paths')
    produce(args.repo, args.description, args.source_root or ['Sources'], args.work_dir,
            args.module_cache, args.output or args.repo / '.cgrx/swift-compiler.json')


if __name__ == '__main__':
    main()
