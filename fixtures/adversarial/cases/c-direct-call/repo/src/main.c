#include <stdio.h>

int add(int a, int b) { return a + b; }

int caller() {
    int result = add(1, 2);
    printf("result: %d\n", result);
    return result;
}
