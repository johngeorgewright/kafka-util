import { mock, type Mock } from 'bun:test'
import { createMockLogger, type LoggerMock } from './Logger'
import type { Consumer, TopicPartitions } from 'kafkajs'

export function createMockConsumer(): ConsumerMock {
  return {
    connect: mock(() => Promise.resolve()),
    disconnect: mock(() => Promise.resolve()),
    subscribe: mock(() => Promise.resolve()),
    run: mock(() => Promise.resolve()),
    stop: mock(() => Promise.resolve()),
    commitOffsets: mock(() => Promise.resolve()),
    seek: mock(() => {}),
    describeGroup: mock(() => Promise.resolve({} as any)),
    pause: mock(() => {}),
    paused: mock(() => []),
    resume: mock(() => {}),
    logger: mock(createMockLogger),
    on: mock(() => () => {}),
    events: {} as any,
  }
}

export interface ConsumerMock extends Consumer {
  connect: Mock<() => Promise<void>>
  disconnect: Mock<() => Promise<void>>
  subscribe: Mock<() => Promise<void>>
  run: Mock<() => Promise<void>>
  stop: Mock<() => Promise<void>>
  commitOffsets: Mock<() => Promise<void>>
  seek: Mock<() => void>
  describeGroup: Mock<() => Promise<any>>
  pause: Mock<(topics: Array<{ topic: string; partitions?: number[] }>) => void>
  paused: Mock<() => TopicPartitions[]>
  resume: Mock<
    (topics: Array<{ topic: string; partitions?: number[] }>) => void
  >
  logger: Mock<() => LoggerMock>
  on: Mock<() => () => void>
  events: any
}
