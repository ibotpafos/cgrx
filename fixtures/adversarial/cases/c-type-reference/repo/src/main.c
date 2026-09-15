#include <stdio.h>

typedef struct Point {
    int x;
    int y;
} Point;

int area(Point *p) {
    return p->x * p->y;
}

int main() {
    Point origin = { 0, 0 };
    return area(&origin);
}