infix operator <+>: AdditionPrecedence
infix operator ⊕: AdditionPrecedence
prefix operator ~++
postfix operator ++

struct First: Comparable {
    let value: Int

    static func < (lhs: First, rhs: First) -> Bool { lhs.value < rhs.value }
    static func == (lhs: First, rhs: First) -> Bool { lhs.value == rhs.value }
    static func <+> (lhs: First, rhs: First) -> First {
        First(value: lhs.value + rhs.value)
    }
    static func ⊕ (lhs: First, rhs: First) -> First { lhs <+> rhs }
    static prefix func ~++ (value: First) -> First { value <+> First(value: 1) }
    static postfix func ++ (value: First) -> First { value <+> First(value: 2) }
}

struct Second {
    let value: Int
    static func <+> (lhs: Second, rhs: Second) -> Second {
        Second(value: lhs.value - rhs.value)
    }
}

func compare(_ lhs: First, _ rhs: First) -> Bool { lhs < rhs || lhs == rhs }
func combineFirst(_ lhs: First, _ rhs: First) -> First { lhs <+> rhs }
func combineSecond(_ lhs: Second, _ rhs: Second) -> Second { lhs <+> rhs }
func combineUnicode(_ lhs: First, _ rhs: First) -> First { lhs ⊕ rhs }
func prefixFirst(_ value: First) -> First { ~++value }
func postfixFirst(_ value: First) -> First { value++ }
