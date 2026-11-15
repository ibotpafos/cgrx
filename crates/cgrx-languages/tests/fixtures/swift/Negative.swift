import Foundation

func same(_ value: Int) {}
func same(_ value: String) {}
func overloaded() { same(1) }
func sink() {}
func parameterShadow(_ sink: () -> Void) { sink() }
func localShadow() { let sink = {}; sink() }
func nestedShadow() { func sink() {}; sink() }
func closureCall() { let action = { sink() }; action() }
func loopShadow(_ actions: [() -> Void]) { for sink in actions { sink() } }
func optionalShadow(_ action: (() -> Void)?) { if let sink = action { sink() } }

class Virtual {
    func step() {}
    func run() { self.step() }
    class func factory() {}
    static func start() { factory() }
}
protocol Action { func step() }
struct Witness: Action {
    func step() {}
    func run() { self.step() }
}
extension Action { func run() { self.step() } }
func existential(_ action: any Action) { action.step() }

struct Ambiguous {
    func pick(_ value: Int) {}
    func pick(_ value: String) {}
    func run() { self.pick(1) }
}
struct Defaulted {
    func pick(_ value: Int = 1) {}
    func run() { self.pick() }
}
struct Variadic {
    func pick(_ values: Int...) {}
    func run() { self.pick(1) }
}
struct Generic {
    func pick<T>(_ value: T) {}
    func run() { self.pick(1) }
}
struct Box<T> {
    func step() {}
    func run() { self.step() }
}
struct ClosureMember {
    var action: () -> Void
    func run() { self.action() }
}
struct StaticShadow {
    static func step() {}
    func run(_ StaticShadow: StaticShadow.Type) { StaticShadow.step() }
}
// Imported Swift overload is selected, not the local String overload.
func abs(_ text: String) {}
func importCollision() { _ = abs(-1) }
func readLine() -> Int { 1 }
func returnContext() -> String? { Swift.readLine() }

struct Token {}
func typeShadow<Token>(_ value: Token) {}
func localTypeShadow() { typealias Token = Int; let value: Token = 1; _ = value }
struct Container { typealias Token = Int; func consume(_ value: Token) {} }
protocol AssociatedShadow {
    associatedtype Token
    func consume(_ value: Token)
}
struct CapturedStatic {
    static func step() {}
}
func capturedTypeShadow(_ CapturedStatic: CapturedStatic.Type) {
    func nested() { CapturedStatic.step() }
    nested()
}
struct Constrained<T> {
    func step() {}
    func run() { self.step() }
}
extension Constrained where T == Int {
    func finish() { self.step() }
}
class Inherited: Virtual {
    final func own() {}
    func invoke() { self.own(); self.step() }
}
func guardShadow(_ action: (() -> Void)?) {
    guard let sink = action else { return }
    sink()
}
func whileShadow(_ action: (() -> Void)?) {
    while let sink = action { sink(); break }
}
