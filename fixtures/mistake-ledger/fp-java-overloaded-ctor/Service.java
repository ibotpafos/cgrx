class LedgerService {
    int ledgerCaller() { return new LedgerEngine(1).ledgerTarget(); }
}
class LedgerEngine {
    LedgerEngine() {}
    LedgerEngine(int x) {}
    int ledgerTarget() { return 1; }
}
