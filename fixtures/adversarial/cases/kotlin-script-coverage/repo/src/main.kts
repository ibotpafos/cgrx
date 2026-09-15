import java.util.Collections

data class Box(val value: Int)

fun unwrap(b: Box): Int {
    return b.value
}

fun runner(): Int {
    val boxed = Box(7)
    val seed = boxed
    Collections.shuffle(seed)
    return unwrap(boxed)
}