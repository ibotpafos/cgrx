#include <stdio.h>

int stable(void) { return 1; }

int broken() {
    int value = stable();
    int x = 5
    return x;
}
