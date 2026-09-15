import java.util.List

data class Point(val x: Int, val y: Int)

fun area(p: Point): Int {
    return p.x * p.y
}

fun caller(): Int {
    val origin = Point(0, 0)
    val items = List.of(1, 2)
    return area(origin) + items.size()
}