import { memoize } from 'es-toolkit'

export const preventNormalProcessExit = memoize(() => {
  const abortController = new AbortController()

  ;['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGUSR2'].forEach((signal) => {
    process.once(signal, () => {
      console.error('Received signal', signal)
      abortController.abort(new ProcessAbortError(signal))
    })
  })
  ;['unhandledRejection', 'uncaughtException'].forEach((type) => {
    process.on(type, async (e) => {
      console.log(`process.on ${type}`)
      console.error(e)
      abortController.abort(new ProcessAbortError(type))
    })
  })

  return {
    exitProcess: (code = 0) => {
      if (abortController.signal.aborted) {
        console.info(
          'Killing process',
          process.pid,
          'with',
          abortController.signal.reason.signal,
        )
        process.kill(process.pid, abortController.signal.reason.signal)
      } else {
        console.info('Attempting to kill process with code', code)
        process.exit(code)
      }
    },
    processAbortSignal: abortController.signal,
  }
})

export class ProcessAbortError extends Error {
  constructor(public readonly signal: string) {
    super(signal)
  }
}
