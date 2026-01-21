import type { Consumer } from 'kafkajs'
import { preventNormalProcessExit } from './process'

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
