import { memoize } from 'es-toolkit'

/**
 * Prevents normal process exit and provides controlled exit mechanisms.
 *
 * This function intercepts process signals and error events, converting
 * them into an AbortSignal that can be used to coordinate graceful shutdown
 * across your application.
 *
 * @remarks
 * - This function is memoized - subsequent calls return the same instance
 * - Clear the cache with `preventNormalProcessExit.cache.clear()` if you need a fresh instance
 * - Automatically logs received signals and errors to console
 *
 * @example
 * ```typescript
 * import { preventNormalProcessExit } from 'kafka-util/process'
 *
 * const { exitProcess, processAbortSignal } = preventNormalProcessExit()
 *
 * // Use the abort signal to coordinate shutdown
 * processAbortSignal.addEventListener('abort', () => {
 *   console.log('Shutting down gracefully...')
 *   // Cleanup resources
 *   cleanup().then(() => {
 *     exitProcess(0)
 *   })
 * })
 *
 * // Your application logic
 * async function main() {
 *   if (processAbortSignal.aborted) {
 *     console.log('Process already aborted')
 *     return
 *   }
 *
 *   // Do work...
 * }
 *
 * main()
 * ```
 */
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
    /**
     * Exit the process
     *
     * - If the process was aborted due to a signal, it will kill the process with that signal
     * - Otherwise, it exits normally with the provided code (default: 0)
     */
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

    /**
     * An AbortSignal that is aborted when:
     *
     * - Process receives SIGTERM, SIGINT, SIGHUP, or SIGUSR2
     * - An unhandled rejection or uncaught exception occurs
     * - The signal's `reason` property contains a `ProcessAbortError` with the signal/event nam
     */
    processAbortSignal: abortController.signal,
  }
})

export class ProcessAbortError extends Error {
  constructor(public readonly signal: string) {
    super(signal)
  }
}
