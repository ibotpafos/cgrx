interface Worker { run(): string; }
class LocalWorker implements Worker {
  run(): string { return "local"; }
}
class RemoteWorker implements Worker {
  run(): string { return "remote"; }
}
function chooseWorker(useRemote: boolean): Worker {
  return useRemote ? new RemoteWorker() : new LocalWorker();
}
function execute(useRemote: boolean): string {
  const worker: Worker = chooseWorker(useRemote);
  return worker.run();
}
