# Worker Pool Example

This project is a demo of an extensible worker pool system in Node.js using TypeScript and native `worker_threads` module.
It is designed for parallel polling tasks with independent error handling, backoff strategies, and clean shutdown.
It works on Node v23.11.1 and later versions with no ts-node or tsx

## Features

- Parallel polling with configurable workers
- TypeScript for type safety and maintainability
- Clean shutdown and resource management
- Extensible: add new poller types easily

## Prerequisites

- **Node.js v23.11.1** or newer to run ts threads directly with no transpilation

## Installation

```sh
npm i
```

## Build

No need to build! Magic!

## Run

```sh
npm start
```

## Project Structure

- `app.ts` – Main entry point, spawns and manages workers
- `workers.ts` – Worker pool management logic
- `db-poll-worker.ts` – Abstract base class for poller workers
- `fake-api-poller-worker.ts` – Example poller implementation
