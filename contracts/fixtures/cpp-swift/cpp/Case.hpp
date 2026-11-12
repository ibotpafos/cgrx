#include "Support.hpp"
inline int callee(int value) { return value + 1; }
inline int caller() { return callee(1); }
inline Support copy(const Support& value) { return value; }
inline int dispatch(int (*callback)(int)) { return callback(1); }
