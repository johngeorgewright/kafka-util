import type { Consumer } from 'kafkajs'
import { preventNormalProcessExit } from './process'

/**
 * Sets up graceful shutdown handling for a KafkaJS consumer.
 *
 * This function automatically disconnects the consumer when the
 * process receives termination signals or encounters unhandled errors.
 *
 * - Listens for process signals (SIGTERM, SIGINT, SIGHUP, SIGUSR2) and error events (unhandledRejection, uncaughtException)
 * - Automatically calls `consumer.disconnect()` when any of these events occur
 * - Exits the process with code 0 on successful disconnection
 * - Exits the process with code 1 if disconnection fails
 * - If the process is already in an aborted state, disconnects immediately
 *
 * @example
 * ```
 * import { Kafka } from 'kafkajs'
 * import { setupGracefulConsumerShutdown } from 'kafka-util/consumer'
 *
 * const kafka = new Kafka({
 *   clientId: 'my-app',
 *   brokers: ['localhost:9092'],
 * })
 *
 * const consumer = kafka.consumer({ groupId: 'my-group' })
 *
 * await consumer.connect()
 * await consumer.subscribe({ topic: 'my-topic' })
 *
 * // Setup graceful shutdown before running
 * setupGracefulConsumerShutdown(consumer)
 *
 * await consumer.run({
 *   eachMessage: async ({ topic, partition, message }) => {
 *     // Process message
 *   },
 * })
 * ```
 */
export function setupGracefulConsumerShutdown(consumer: Consumer) {
  const { exitProcess, processAbortSignal } = preventNormalProcessExit()

  if (processAbortSignal.aborted) return disconnect()
  processAbortSignal.addEventListener('abort', disconnect)

  async function disconnect() {
    const logger = consumer.logger()
    try {
      await consumer.disconnect()
      logger.info('Successful consumer disconnection')
      exitProcess(0)
    } catch (error) {
      logger.error('Error when disconnecting consumer. Forcing an exit.', {
        error,
      })
      exitProcess(1)
    }
  }
}
