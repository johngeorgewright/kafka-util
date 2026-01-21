import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test'
import { preventNormalProcessExit, ProcessAbortError } from '../src/process'

describe('preventNormalProcessExit', () => {
  let originalOnce: typeof process.once
  let originalOn: typeof process.on
  let originalKill: typeof process.kill
  let originalExit: typeof process.exit

  beforeEach(() => {
    originalOnce = process.once
    originalOn = process.on
    originalKill = process.kill
    originalExit = process.exit
  })

  afterEach(() => {
    process.once = originalOnce
    process.on = originalOn
    process.kill = originalKill
    process.exit = originalExit
    preventNormalProcessExit.cache.clear()
  })

  it('should abort with signal when signal is received', () => {
    const handlers: Record<string, Function> = {}
    process.once = ((signal: string, handler: Function) => {
      handlers[signal] = handler
    }) as any

    const { processAbortSignal } = preventNormalProcessExit()

    handlers['SIGTERM']?.()

    expect(processAbortSignal.aborted).toBe(true)
    expect(processAbortSignal.reason).toBeInstanceOf(ProcessAbortError)
    expect(processAbortSignal.reason.signal).toBe('SIGTERM')
  })

  describe('exitProcess', () => {
    it('should kill process when aborted', () => {
      const killSpy = spyOn(process, 'kill').mockImplementation(() => true)
      const handlers: Record<string, Function> = {}
      process.once = ((signal: string, handler: Function) => {
        handlers[signal] = handler
      }) as any

      const { exitProcess } = preventNormalProcessExit()

      handlers['SIGINT']?.()

      exitProcess()

      expect(killSpy).toHaveBeenCalledWith(process.pid, 'SIGINT')
    })

    it('should exit normally when not aborted', () => {
      const exitSpy = spyOn(process, 'exit').mockImplementation(
        () => undefined as never,
      )

      const { exitProcess } = preventNormalProcessExit()

      exitProcess(42)

      expect(exitSpy).toHaveBeenCalledWith(42)
    })
  })
})
