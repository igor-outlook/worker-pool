import {
  spawnWorkerPool,
  shutdownWorkerPool,
  type WorkerConfig,
} from "./workers.ts";

const workerConfigs: WorkerConfig[] = [
  { name: "PollerA", type: "fake" },
  { name: "PollerB", type: "fake" },
  { name: "PollerC", type: "fake" },
];

spawnWorkerPool(workerConfigs);

process.on("SIGINT", () => shutdownWorkerPool("SIGINT"));
process.on("SIGTERM", () => shutdownWorkerPool("SIGTERM"));
process.on("SIGUSR2", () => shutdownWorkerPool("SIGUSR2"));
