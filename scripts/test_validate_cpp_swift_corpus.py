import unittest
from validate_cpp_swift_corpus import validate_training, ROOT
from pathlib import Path
from unittest.mock import patch
import json
class CppSwiftCorpusTests(unittest.TestCase):
    def test_committed_fixture_and_all_raw_anchors_validate(self):
        self.assertEqual(validate_training(),28)
    def test_cannot_relabel_training_as_heldout(self):
        read=Path.read_text
        def changed(path,*args,**kwargs):
            text=read(path,*args,**kwargs)
            if path==ROOT/'contracts/real_tasks_v1.json':
                doc=json.loads(text)
                for task in doc['tasks']:
                    if task['repo']=='/CGRX_CPP_SWIFT_TRAINING_FIXTURE':task['split']='heldout'
                return json.dumps(doc)
            return text
        with patch.object(Path,'read_text',changed),self.assertRaises(ValueError):validate_training()
    def test_stale_raw_span_hash_fails(self):
        read=Path.read_text
        def changed(path,*args,**kwargs):
            text=read(path,*args,**kwargs)
            if path==ROOT/'contracts/real_tasks_v1.json':
                doc=json.loads(text)
                next(t for t in doc['tasks'] if t['repo']=='/CGRX_CPP_SWIFT_TRAINING_FIXTURE')['evidence']['source']['span_sha256']='0'*64
                return json.dumps(doc)
            return text
        with patch.object(Path,'read_text',changed),self.assertRaises(ValueError):validate_training()
if __name__=='__main__':unittest.main()
