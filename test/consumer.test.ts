import {
  describe,
  it,
  expect,
  mock,
  afterEach,
  beforeEach,
  type Mock,
} from 'bun:test'
import { setTimeout } from 'node:timers/promises'
import { createMockConsumer, type ConsumerMock } from '../src/mocks/Consumer'
import { setupGracefulConsumerShutdown } from '../src/consumer'

describe('setupGracefulConsumerShutdown', () => {
  let exitProcess: Mock<() => void>
  let mockConsumer: ConsumerMock
  let abortController: AbortController

  beforeEach(async () => {
    mockConsumer = createMockConsumer()
    abortController = new AbortController()
    exitProcess = mock(() => {})
    await mock.module('../src/process', () => ({
      preventNormalProcessExit: mock(() => ({
        exitProcess,
        processAbortSignal: abortController.signal,
      })),
    }))
  })

  afterEach(() => {
    mock.restore()
  })

  it('should disconnect immediately if signal is already aborted', async () => {
    abortController.abort()
    setupGracefulConsumerShutdown(mockConsumer)
    await setTimeout(10)
    expect(mockConsumer.disconnect).toHaveBeenCalled()
    expect(exitProcess).toHaveBeenCalledWith(0)
  })

  it('should disconnect consumer and exit with 0 on successful disconnect', async () => {
    setupGracefulConsumerShutdown(mockConsumer)
    abortController.abort()
    await setTimeout(10)
    expect(mockConsumer.disconnect).toHaveBeenCalled()
    expect(exitProcess).toHaveBeenCalledWith(0)
  })

  it('should exit with 1 when disconnect fails', async () => {
    mockConsumer.disconnect.mockRejectedValue(new Error('Disconnect failed'))
    setupGracefulConsumerShutdown(mockConsumer)
    abortController.abort()
    await setTimeout(10)
    expect(mockConsumer.disconnect).toHaveBeenCalled()
    expect(exitProcess).toHaveBeenCalledWith(1)
  })
})
