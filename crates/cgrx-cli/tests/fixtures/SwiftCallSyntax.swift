struct Box<T> {
    let value: T
    init(_ value: T) { self.value = value }
}
func digest(_ value: Int) -> String { String(value) }
func ready(_ value: Int) -> Bool { value > 0 }
func callSyntax(_ flag: Bool, _ value: Int) -> String {
    let box = Box<Int>(value)
    let tag = "sha256:" + digest(box.value)
    let negative = !ready(value)
    let conjunction = flag && ready(value)
    let choice = flag ? tag : digest(value)
    return negative || conjunction ? tag : choice
}
func genericIdentity<T>(_ type: T.Type, value: T) -> T { value }
func indirectSyntax(_ flag: Bool, _ first: () -> Int, _ second: () -> Int) -> Int {
    (flag ? first : second)()
}
