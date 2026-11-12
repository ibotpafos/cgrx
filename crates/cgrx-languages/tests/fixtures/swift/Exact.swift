import Foundation

private func announce() {}
private func refresh() async throws {}
func start() { announce() }
func startAsync() async throws { try await refresh() }

struct Snapshot {}
private protocol Previewing { func preview(_ value: Snapshot) }
typealias SavedSnapshot = Snapshot

private struct Counter {
    let snapshot: Snapshot
    func reset() {}
    func write(value: Int) {}
    func write(text: String) {}
    static func normalize(_ value: Int) {}
    func run() {
        self.reset()
        write(value: 1)
        self.write(text: "hello")
        Counter.normalize(2)
    }
}
extension Counter {
    func finish() { self.reset() }
    func receive(_ value: Snapshot) -> SavedSnapshot { value }
}

final class Session {
    func close() {}
    func stop() { self.close() }
}
class BaseSession {
    final func flush() {}
    func stop() { self.flush() }
}
actor Worker {
    func step() {}
    func run() { self.step() }
}
struct Café {
    func résumé() {}
    func run() { self.résumé() }
    func `repeat`() {}
    func escaped() { self.`repeat`() }
}
