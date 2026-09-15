#ifndef TYPES_H
#define TYPES_H

#include <stddef.h>

struct Point {
    int x;
    int y;
};

typedef struct Point Point;

int add_one(int v) {
    return v + 1;
}

int helper(int x) {
    return add_one(x);
}

int report_all(void);

void check(void) {
    report_all(1);
}

#endif