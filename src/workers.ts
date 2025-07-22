import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type PollerType = "fake";
type WorkerConfig = { name: string; type: PollerType };

const pollerTypeToWorkerFile = {
  fake: "./fake-api-poller-worker.ts",
};

const workers: Record<string, Worker> = {};

export function spawnWorkerPool(workerConfigs: WorkerConfig[]) {
  workerConfigs.forEach(({ name, type }) => {
    const workerFile = pollerTypeToWorkerFile[type];
    if (!workerFile) {
      console.error(`No worker file for poller type: ${type}`);
      return;
    }
    const worker = new Worker(path.resolve(__dirname, workerFile));
    workers[name] = worker;
    worker.on("message", (msg) => {
      if (msg.event === "FAKE_API_RESULT") {
        console.log(`[${msg.name}]`, msg.data);
      }
      if (msg.event === "ERROR") {
        console.error(`[${msg.name}] Worker error:`, msg.error);
      }
      if (msg.event === "STOPPED") {
        console.log(`[${msg.name}] stopped`);
      }
    });
    worker.postMessage({ cmd: "start", name });
  });
}

export function shutdownWorkerPool(signal: string) {
  console.log(`${signal} received, cleaning up...`);
  Object.values(workers).forEach((worker) =>
    worker.postMessage({ cmd: "stop" })
  );
  setTimeout(() => {
    Object.values(workers).forEach((worker) => worker.terminate());
    process.exit();
  }, 1000);
}

export type { WorkerConfig, PollerType };
