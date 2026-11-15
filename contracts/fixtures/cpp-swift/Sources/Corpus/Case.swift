import FixtureSupport
struct Payload { let value: Int }
func leaf() -> Int { return 1 }
func entry() -> Int { return leaf() }
func typed(_ value: Payload) -> Payload { return value }
func dynamic(_ callback: () -> Int) -> Int { return callback() }
