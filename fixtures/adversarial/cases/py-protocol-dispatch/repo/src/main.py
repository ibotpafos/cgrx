from typing import Protocol

class Worker(Protocol):
    def run(self) -> str: ...

class LocalWorker:
    def run(self) -> str:
        return "local"

class RemoteWorker:
    def run(self) -> str:
        return "remote"

def choose_worker(use_remote: bool) -> Worker:
    return RemoteWorker() if use_remote else LocalWorker()

def execute(use_remote: bool) -> str:
    worker = choose_worker(use_remote)
    return worker.run()
