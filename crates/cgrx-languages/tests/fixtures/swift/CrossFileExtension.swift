extension Engine {
    func send(_ value: String) {}
    func result() -> String { "text" }
}
extension Holder { typealias Payload = Other }
func witness(_ value: Holder) -> Other { value.value }
