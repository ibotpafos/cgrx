final class Service {
    static int javaTarget() { return 1; }
    static int javaCaller() { return javaTarget(); }
}
