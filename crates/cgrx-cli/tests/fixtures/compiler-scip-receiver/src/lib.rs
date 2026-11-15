pub struct A;
pub struct B;
impl A { pub fn work(&self) {} }
impl B { pub fn work(&self) {} }
pub fn caller(worker: A) { worker.work(); }
pub struct Reader;
impl Reader { pub fn options(&mut self) {} }
pub fn local_reader() { let mut reader = Reader; reader.options(); }
