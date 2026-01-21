import { mock, type Mock } from 'bun:test'
import type { Logger, logLevel } from 'kafkajs'

export function createMockLogger(): MockLogger {
  return {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    debug: mock(() => {}),
    namespace: mock(createMockLogger),
    setLogLevel: mock(() => {}),
  }
}

export interface MockLogger extends Logger {
  info: Mock<(message: string, extra?: object) => void>
  error: Mock<(message: string, extra?: object) => void>
  warn: Mock<(message: string, extra?: object) => void>
  debug: Mock<(message: string, extra?: object) => void>
  namespace: Mock<(namespace: string, logLevel?: logLevel) => Logger>
  setLogLevel: Mock<(logLevel: logLevel) => void>
}
