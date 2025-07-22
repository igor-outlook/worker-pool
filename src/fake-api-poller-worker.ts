import { parentPort } from "worker_threads";
import { DbPollWorker } from "./db-poll-worker.ts";

async function fakeApiCall(
  name: string
): Promise<{ name: string; delay: number; timestamp: string }> {
  const delay = Math.floor(Math.random() * 2000) + 1000;
  await new Promise((res) => setTimeout(res, delay));
  if (Math.random() < 0.2) throw new Error(`${name} failed!`);
  return { name, delay, timestamp: new Date().toISOString() };
}

class FakeApiPollerWorker extends DbPollWorker {
  async poll(name: string): Promise<any> {
    const result = await fakeApiCall(name);
    parentPort.postMessage({ event: "FAKE_API_RESULT", name, data: result });
  }
}

new FakeApiPollerWorker(2000, 10000).setupMessageHandler();
