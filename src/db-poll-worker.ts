import { parentPort } from "worker_threads";

/**
 * Base class for Database poller workers.
 * Handles polling loop, error backoff, and message-based lifecycle control.
 */
export abstract class DbPollWorker {
  pollInterval: number;
  maxInterval: number;
  currentInterval: number;
  stopped = false;
  pollerName: string | null = null;
  timerId: NodeJS.Timeout | null = null;

  /**
   * @param pollInterval - Base polling interval in ms
   * @param maxInterval - Maximum backoff interval in ms
   */
  constructor(pollInterval = 30000, maxInterval = 300000) {
    this.pollInterval = pollInterval;
    this.maxInterval = maxInterval;
    this.currentInterval = pollInterval;
  }

  abstract poll(...args: any[]): Promise<any>;

  /**
   * Main polling loop.
   * Calls poll() repeatedly, applying logarithmic backoff on errors.
   * @param args - Arguments passed to poll()
   */
  async startPolling(...args: any[]): Promise<void> {
    this.stopped = false;
    let retryAttempt = 1; // Number of consecutive failures for logging
    while (!this.stopped) {
      try {
        // Subclass must implement poll()
        await this.poll(...args);

        // On success: reset interval and retry counter
        this.currentInterval = this.pollInterval;
        retryAttempt = 1;
      } catch (err) {
        // Log error for visibility
        console.error(`[${this.pollerName}] Poll error:`, err);

        /**
         * Logarithmic backoff calculation:
         * - retryAttempt starts at 1
         * - Math.log(retryAttempt + 1) ensures first retry is not zero
         * - Backoff grows slowly, allowing time-sensitive polling
         * Example values (pollInterval = 2000):
         *   Retry 1: 1386ms
         *   Retry 2: 2197ms
         *   Retry 3: 2772ms
         *   Retry 4: 3218ms
         */
        this.currentInterval = Math.min(
          Math.round(this.pollInterval * Math.log(retryAttempt + 1)),
          this.maxInterval
        );
        // Log backoff interval for debugging
        console.log(
          `[${this.pollerName}] Logarithmic backoff (retry ${retryAttempt}): ${this.currentInterval}ms`
        );
        retryAttempt++;
      }
      // Use setTimeout and keep a reference to the timer
      await new Promise((resolve) => {
        this.timerId = setTimeout(resolve, this.currentInterval);
      });
      // If stopped during timeout, clear it
      if (this.stopped && this.timerId) {
        clearTimeout(this.timerId);
      }
    }
  }

  /**
   * Signals the polling loop to stop.
   */
  stopPolling(): void {
    this.stopped = true;
  }

  /**
   * Graceful cleanup for worker termination.
   * Ensures polling loop has time to exit and releases resources.
   */
  async cleanup(): Promise<void> {
    this.stopPolling();
    // Clear any outstanding timers
    if (typeof this.timerId !== "undefined" && this.timerId) {
      clearTimeout(this.timerId);
    }
    // Remove message listeners to avoid leaks if worker reused
    parentPort.removeAllListeners("message");
    // Send final status to parent
    if (parentPort) {
      parentPort.postMessage({ event: "CLEANED_UP", name: this.pollerName });
    }
    // Wait a short time for the polling loop to exit
    await new Promise((res) => setTimeout(res, 200));
  }

  /**
   * Sets up message handling for worker lifecycle.
   * Listens for 'start' and 'stop' commands from parent thread.
   */
  setupMessageHandler() {
    parentPort.on("message", async (msg) => {
      if (msg.cmd === "start") {
        this.pollerName = msg.name;
        await this.startPolling(this.pollerName);
      }
      if (msg.cmd === "stop") {
        this.stopPolling();
        await this.cleanup();
        parentPort.postMessage({ event: "STOPPED", name: this.pollerName });
      }
    });
  }
}
