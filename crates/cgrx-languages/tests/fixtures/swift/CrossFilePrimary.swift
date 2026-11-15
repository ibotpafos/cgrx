struct Payload {}
struct Other {}
struct Holder { var value: Payload }
struct Engine {
    func send(_ value: Int) {}
    func invoke() { send("text") }
    func result() -> Int { 1 }
    func contextual() -> String { result() }
}
