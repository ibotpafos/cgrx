class LedgerService {
    int ledgerCaller() { LedgerEngine engine = new LedgerEngine(); return engine.ledgerTarget(); }
}
class LedgerEngine {
    LedgerEngine() {}
    int ledgerTarget() { return 1; }
}
