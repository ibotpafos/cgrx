"""Read active Swift units through the producing toolchain's public C API.

Role bits and USRs are preserved; display names never resolve endpoints.
API reference: swiftlang/indexstore-db Sources/IndexStoreCAPI/include/IndexStoreCAPI.
"""
import ctypes as C
from pathlib import Path

class StringRef(C.Structure):
    _fields_ = [('data', C.c_void_p), ('length', C.c_size_t)]
    def text(self):
        return C.string_at(self.data, self.length).decode('utf-8') if self.length else ''

def read(store_path, root, library):
    root = Path(root).resolve()
    lib = C.CDLL(str(library))
    ptr = C.c_void_p
    callback = C.CFUNCTYPE(C.c_bool, ptr, ptr)
    unit_callback = C.CFUNCTYPE(C.c_bool, ptr, StringRef)
    def bind(name, result, *arguments):
        f = getattr(lib, 'indexstore_' + name)
        f.restype = result; f.argtypes = arguments
        return f
    error_text = bind('error_get_description', C.c_char_p, ptr)
    error_free = bind('error_dispose', None, ptr)
    def create(name, *args):
        error = ptr()
        result = name(*args, C.byref(error))
        if not result:
            message = error_text(error).decode() if error else 'unknown IndexStore error'
            if error: error_free(error)
            raise RuntimeError(message)
        return result
    store_create = bind('store_create', ptr, C.c_char_p, C.POINTER(ptr))
    store_free = bind('store_dispose', None, ptr)
    units_apply = bind('store_units_apply_f', C.c_bool, ptr, C.c_uint, ptr, unit_callback)
    unit_create = bind('unit_reader_create', ptr, ptr, C.c_char_p, C.POINTER(ptr))
    unit_free = bind('unit_reader_dispose', None, ptr)
    unit_module = bind('unit_reader_get_module_name', StringRef, ptr)
    unit_provider = bind('unit_reader_get_provider_identifier', StringRef, ptr)
    deps_apply = bind('unit_reader_dependencies_apply_f', C.c_bool, ptr, ptr, callback)
    dep_kind = bind('unit_dependency_get_kind', C.c_uint, ptr)
    dep_path = bind('unit_dependency_get_filepath', StringRef, ptr)
    dep_name = bind('unit_dependency_get_name', StringRef, ptr)
    record_create = bind('record_reader_create', ptr, ptr, C.c_char_p, C.POINTER(ptr))
    record_free = bind('record_reader_dispose', None, ptr)
    occurrences_apply = bind('record_reader_occurrences_apply_f', C.c_bool, ptr, ptr, callback)
    symbol_of = bind('occurrence_get_symbol', ptr, ptr)
    roles_of = bind('occurrence_get_roles', C.c_uint64, ptr)
    line_col = bind('occurrence_get_line_col', None, ptr, C.POINTER(C.c_uint), C.POINTER(C.c_uint))
    relations_apply = bind('occurrence_relations_apply_f', C.c_bool, ptr, ptr, callback)
    relation_roles = bind('symbol_relation_get_roles', C.c_uint64, ptr)
    relation_symbol = bind('symbol_relation_get_symbol', ptr, ptr)
    usr_of = bind('symbol_get_usr', StringRef, ptr)
    name_of = bind('symbol_get_name', StringRef, ptr)
    kind_of = bind('symbol_get_kind', C.c_uint, ptr)
    subkind_of = bind('symbol_get_subkind', C.c_uint, ptr)
    failures = []
    def checked(f):
        def wrapped(*args):
            try: return f(*args)
            except Exception as error:
                failures.append(error)
                return False
        return wrapped
    store = create(store_create, str(store_path).encode())
    output = []; records = set(); units = []
    try:
        @unit_callback
        @checked
        def add_unit(_, name):
            units.append(name.text()); return True
        if not units_apply(store, 1, None, add_unit): raise RuntimeError('cannot enumerate IndexStore units')
        for unit_name in units:
            unit = create(unit_create, store, unit_name.encode())
            dependencies = []
            try:
                if unit_provider(unit).text() != 'swift': continue
                module = unit_module(unit).text()
                @callback
                @checked
                def add_dependency(_, dep):
                    if dep_kind(dep) == 2:
                        file = Path(dep_path(dep).text()).resolve()
                        if file.suffix == '.swift' and file.is_relative_to(root):
                            dependencies.append((dep_name(dep).text(), str(file.relative_to(root))))
                    return True
                if not deps_apply(unit, None, add_dependency): raise RuntimeError('cannot enumerate IndexStore dependencies')
            finally: unit_free(unit)
            for record_name, path in dependencies:
                if (record_name, path, module) in records: continue
                records.add((record_name, path, module))
                record = create(record_create, store, record_name.encode())
                try:
                    @callback
                    @checked
                    def add_occurrence(_, occurrence):
                        symbol = symbol_of(occurrence)
                        line, column = C.c_uint(), C.c_uint()
                        line_col(occurrence, C.byref(line), C.byref(column))
                        relations = []
                        @callback
                        @checked
                        def add_relation(_, relation):
                            relations.append({'usr':usr_of(relation_symbol(relation)).text(), 'roles':relation_roles(relation)})
                            return True
                        if not relations_apply(occurrence, None, add_relation): raise RuntimeError('cannot enumerate symbol relations')
                        output.append({'path':path, 'module':module, 'line':line.value, 'column':column.value, 'usr':usr_of(symbol).text(), 'name':name_of(symbol).text(), 'kind':kind_of(symbol), 'subkind':subkind_of(symbol), 'roles':roles_of(occurrence), 'relations':relations})
                        return True
                    if not occurrences_apply(record, None, add_occurrence): raise RuntimeError('cannot enumerate IndexStore occurrences')
                finally: record_free(record)
        if failures: raise failures[0]
    finally: store_free(store)
    return {'format_version':bind('format_version',C.c_uint)(), 'api_version':bind('version',C.c_uint)(), 'occurrences':output, 'units':len(units), 'records':len(records)}
