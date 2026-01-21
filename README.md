# kafka-util

Helpful utilities and common patterns and practices when using Kafka

## Installation

```bash
npm install kafka-util
# or
bun add kafka-util
# or
yarn add kafka-util
```

## API

### `kafka-util/consumer`

#### `setupGracefulConsumerShutdown(consumer: Consumer): void`

Sets up graceful shutdown handling for a KafkaJS consumer. This function automatically disconnects the consumer when the process receives termination signals or encounters unhandled errors.

**Parameters:**

- `consumer` (Consumer) - A KafkaJS consumer instance

**Behavior:**

- Listens for process signals (SIGTERM, SIGINT, SIGHUP, SIGUSR2) and error events (unhandledRejection, uncaughtException)
- Automatically calls `consumer.disconnect()` when any of these events occur
- Exits the process with code 0 on successful disconnection
- Exits the process with code 1 if disconnection fails
- If the process is already in an aborted state, disconnects immediately

**Example:**

```typescript
import { Kafka } from 'kafkajs'
import { setupGracefulConsumerShutdown } from 'kafka-util/consumer'

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
})

const consumer = kafka.consumer({ groupId: 'my-group' })

await consumer.connect()
await consumer.subscribe({ topic: 'my-topic' })

// Setup graceful shutdown before running
setupGracefulConsumerShutdown(consumer)

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    // Process message
  },
})
```

### `kafka-util/process`

#### `preventNormalProcessExit(): { exitProcess: (code?: number) => void, processAbortSignal: AbortSignal }`

Prevents normal process exit and provides controlled exit mechanisms. This function intercepts process signals and error events, converting them into an AbortSignal that can be used to coordinate graceful shutdown across your application.

**Returns:**

- `exitProcess(code?: number)` - Function to exit the process
  - If the process was aborted due to a signal, it will kill the process with that signal
  - Otherwise, it exits normally with the provided code (default: 0)
- `processAbortSignal` - An AbortSignal that is aborted when:
  - Process receives SIGTERM, SIGINT, SIGHUP, or SIGUSR2
  - An unhandled rejection or uncaught exception occurs
  - The signal's `reason` property contains a `ProcessAbortError` with the signal/event name

**Notes:**

- This function is memoized - subsequent calls return the same instance
- Clear the cache with `preventNormalProcessExit.cache.clear()` if you need a fresh instance
- Automatically logs received signals and errors to console

**Example:**

```typescript
import { preventNormalProcessExit } from 'kafka-util/process'

const { exitProcess, processAbortSignal } = preventNormalProcessExit()

// Use the abort signal to coordinate shutdown
processAbortSignal.addEventListener('abort', () => {
  console.log('Shutting down gracefully...')
  // Cleanup resources
  cleanup().then(() => {
    exitProcess(0)
  })
})

// Your application logic
async function main() {
  if (processAbortSignal.aborted) {
    console.log('Process already aborted')
    return
  }

  // Do work...
}

main()
```

#### `ProcessAbortError`

An error class that represents a process abort event.

**Properties:**

- `signal` (string) - The name of the signal or event that caused the abort (e.g., 'SIGTERM', 'unhandledRejection')

**Example:**

```typescript
import { preventNormalProcessExit, ProcessAbortError } from 'kafka-util/process'

const { processAbortSignal } = preventNormalProcessExit()

processAbortSignal.addEventListener('abort', () => {
  if (processAbortSignal.reason instanceof ProcessAbortError) {
    console.log(`Aborted due to: ${processAbortSignal.reason.signal}`)
  }
})
```

## Common Patterns

### Combining Process Control with Consumer Shutdown

The `setupGracefulConsumerShutdown` function internally uses `preventNormalProcessExit`, so you typically don't need to use both together. However, if you need to coordinate shutdown across multiple resources:

```typescript
import { Kafka } from 'kafkajs'
import { preventNormalProcessExit } from 'kafka-util/process'

const kafka = new Kafka({
  /* ... */
})
const consumer = kafka.consumer({ groupId: 'my-group' })

const { exitProcess, processAbortSignal } = preventNormalProcessExit()

processAbortSignal.addEventListener('abort', async () => {
  // Cleanup multiple resources
  await consumer.disconnect()
  await otherResource.cleanup()
  exitProcess(0)
})

await consumer.connect()
await consumer.subscribe({ topic: 'my-topic' })
await consumer.run({
  /* ... */
})
```

## License

See [LICENSE](LICENSE) file for details.
