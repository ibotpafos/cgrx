fun greet(): String = "hello"

fun caller(): String {
    val message = greet()
    println(message)
    return message
}
