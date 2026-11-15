import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import index_swift as producer


class SwiftProducerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='cgrx-swift-producer-')
        self.addCleanup(self.directory.cleanup)
        self.base = Path(self.directory.name).resolve()
        self.repo = self.base / 'repo'
        (self.repo / 'Sources').mkdir(parents=True)
        self.source = self.repo / 'Sources/Core.swift'
        self.source.write_bytes(b'struct Core {}\r\n')
        (self.repo / 'Package.swift').write_text('// package\n')
        self.swiftc = self.base / 'toolchain/bin/swiftc'
        self.swiftc.parent.mkdir(parents=True)
        self.swiftc.write_bytes(b'compiler identity')
        library = self.base / 'toolchain/lib/libIndexStore.dylib'
        library.parent.mkdir()
        library.write_bytes(b'library identity')
        self.command = dict(moduleName='Core', sources=[str(self.source)],
                            inputs=[dict(kind='file', name=str(self.source))],
                            importPath=str(self.base / 'imports'), otherArguments=['-swift-version', '5'])
        self.description = self.base / 'description.json'
        self.description.write_text(json.dumps(dict(swiftCommands={'Core': self.command})))
        self.output = self.base / 'swift-compiler.json'
        self.output.write_text('previous verified input')

    def produce(self, compile_action=None, occurrences=None):
        def command_output(args, **_):
            if args[0] == 'git':
                return str(self.repo) + '\n'
            if args[0] == 'xcrun':
                return str(self.swiftc) + '\n'
            return 'Swift fixture version\n'
        with contextlib.redirect_stdout(io.StringIO()), patch.object(producer.subprocess, 'check_output', side_effect=command_output), patch.object(producer.subprocess, 'run', side_effect=compile_action), patch.object(producer, 'read_indexstore', return_value={'occurrences': occurrences if occurrences is not None else [{'path': 'Sources/Core.swift'}]}):
            producer.produce(self.repo, self.description, ['Sources'], self.base / 'work', self.base / 'module-cache', self.output)

    def test_preserves_exact_crlf_bytes_and_records_context(self):
        self.produce()
        payload = json.loads(self.output.read_text())
        self.assertEqual(payload['sources']['Sources/Core.swift'], 'struct Core {}\r\n')
        self.assertIn(str(self.swiftc), payload['inputs'])
        self.assertIn(str(self.repo / 'Package.swift'), payload['inputs'])
        self.assertEqual(self.output.stat().st_mode & 0o777, 0o600)

    def test_changed_source_never_replaces_previous_input(self):
        self.assertRaises(ValueError, self.produce, lambda *_, **__: self.source.write_text('struct Changed {}\n'))
        self.assertEqual(self.output.read_text(), 'previous verified input')

    def test_changed_package_never_replaces_previous_input(self):
        self.assertRaises(ValueError, self.produce, lambda *_, **__: (self.repo / 'Package.swift').write_text('// changed build settings\n'))
        self.assertEqual(self.output.read_text(), 'previous verified input')

    def test_failed_build_never_replaces_previous_input(self):
        def fail(*_, **__):
            raise subprocess.CalledProcessError(1, ['swiftc'])
        self.assertRaises(subprocess.CalledProcessError, self.produce, fail)
        self.assertEqual(self.output.read_text(), 'previous verified input')

    def test_missing_record_and_stale_module_membership_are_rejected(self):
        self.assertRaises(ValueError, self.produce, occurrences=[])
        (self.repo / 'Sources/Extension.swift').write_text('extension Core {}\n')
        self.assertRaises(ValueError, self.produce)
        self.assertEqual(self.output.read_text(), 'previous verified input')

    def test_forwarded_arguments_survive_output_redirection(self):
        flags = ['-Xcc', '-g', '-Xfrontend', '-entry-point-function-name', '-Xfrontend', 'App_main',
                 '-incremental', '-index-store-path', '/old/store', '-j8', '-DDEBUG']
        self.assertEqual(producer.semantic_arguments(flags), flags[:6] + ['-DDEBUG'])

    def test_module_dependencies_are_compiled_first(self):
        app = dict(self.command, moduleName='App', inputs=[dict(kind='file', name='/old/Core.swiftmodule')])
        commands = producer.ordered_modules(dict(swiftCommands={'App': app, 'Core': self.command}), self.repo, {'Sources/Core.swift'})
        self.assertEqual([x['moduleName'] for x in commands], ['Core', 'App'])

    def test_symlinks_are_not_silently_excluded_from_membership(self):
        (self.repo / 'Sources/Link.swift').symlink_to(self.source)
        self.assertRaises(ValueError, producer.inventory, self.repo, ['Sources'])


if __name__ == '__main__':
    unittest.main()
