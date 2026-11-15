struct Aliased {
    func step(_ value: Int) {}
    func run() { self.step("text") }
}
typealias Alias = Aliased
extension Alias { func step(_ value: String) {} }
