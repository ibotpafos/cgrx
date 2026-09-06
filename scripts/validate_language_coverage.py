#!/usr/bin/env python3
"""Fail closed when the task corpus loses a registered language-pack cell."""
import argparse
import json
from pathlib import Path
import re
import sys

from validate_real_tasks import validate as validate_tasks


def require(value, message):
    if not value:
        raise ValueError(message)


def fields(value, required):
    require(isinstance(value, dict) and set(value) == set(required), 'invalid coverage fields')


def source_extensions(root, language):
    relative = Path(language['source'])
    require(not relative.is_absolute() and '..' not in relative.parts, 'unsafe language source')
    path = root / relative
    require(path.is_file() and path.resolve() == path, 'language source unavailable')
    text = path.read_text()
    ids = re.findall(r'fn id\(&self\).*?\{\s*"([a-z]+)"\s*\}', text, re.S)
    require(ids == [language['id']], 'language id differs from source')
    matches = re.findall(r'fn extensions\(&self\).*?\{\s*&\[([^]]*)\]', text, re.S)
    require(len(matches) == 1, 'language extensions unavailable')
    return re.findall(r'"([a-z0-9]+)"', matches[0])


def validate_coverage(contract, corpus, root):
    fields(contract, ('schema_version','relations','languages'))
    require(contract['schema_version'] == 1, 'unsupported coverage schema')
    relations = contract['relations']
    require(relations == ['CALLS','IMPORTS','REFERENCE','UNRESOLVED'], 'invalid relation contract')
    require(isinstance(contract['languages'],list) and contract['languages'], 'languages required')
    tasks = {task['id']: task for task in corpus['tasks']}
    require(len(tasks) == len(corpus['tasks']), 'duplicate corpus task id')
    modules=set(); extensions=set(); covered=set()
    for language in contract['languages']:
        fields(language, ('id','module','source','extensions','cells'))
        require(re.fullmatch(r'[a-z]+',language['id']) is not None, 'invalid language id')
        require(re.fullmatch(r'[a-z_]+',language['module']) is not None, 'invalid language module')
        require(language['module'] not in modules, 'duplicate language module'); modules.add(language['module'])
        declared=language['extensions']
        require(declared and len(declared)==len(set(declared)), 'invalid extensions')
        require(source_extensions(root,language) == declared, 'extension contract differs from source')
        require(set(language['cells']) == set(declared), 'missing extension cells')
        for extension in declared:
            require(extension not in extensions, 'extension belongs to multiple languages'); extensions.add(extension)
            cells=language['cells'][extension]
            require(isinstance(cells,dict) and set(cells) == set(relations), 'missing relation cells')
            for relation, ids in cells.items():
                require(isinstance(ids,list) and ids and len(ids)==len(set(ids)), 'empty or duplicate task cell')
                for task_id in ids:
                    require(task_id in tasks, 'coverage task missing from corpus')
                    task=tasks[task_id]
                    require(task['expected']['relation'] == relation, 'coverage task relation mismatch')
                    require(task['evidence']['source']['path'].endswith('.'+extension), 'coverage task extension mismatch')
                    covered.add(task_id)
    pack=(root/'crates/cgrx-languages/src/pack.rs').read_text()
    parts=pack.split('pub fn pack_for_path',1)
    require(len(parts)==2, 'language pack registry unavailable')
    body=parts[1].split('.into_iter()',1)[0]
    registered=set(re.findall(r'&crate::([a-z_]+)::[A-Z]+',body))
    require(registered == modules, 'registered language packs differ from coverage contract')
    corpus_extensions={task['evidence']['source']['path'].rsplit('.',1)[-1] for task in corpus['tasks']}
    require(corpus_extensions <= extensions, 'corpus contains an unsupported extension')
    return len(modules),len(extensions),len(extensions)*len(relations),len(covered)


def main():
    root=Path(__file__).resolve().parents[1]
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('corpus',nargs='?',type=Path,default=root/'contracts/real_tasks_v1.json')
    parser.add_argument('contract',nargs='?',type=Path,default=root/'contracts/language_coverage_v1.json')
    args=parser.parse_args()
    try:
        corpus=json.loads(args.corpus.read_text()); validate_tasks(corpus)
        contract=json.loads(args.contract.read_text())
        languages,extensions,cells,tasks=validate_coverage(contract,corpus,root)
    except (OSError,ValueError,TypeError,KeyError,json.JSONDecodeError) as exc:
        print('INVALID: '+str(exc),file=sys.stderr); return 1
    print(f'VALID languages={languages} extensions={extensions} relation_cells={cells} coverage_tasks={tasks}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
