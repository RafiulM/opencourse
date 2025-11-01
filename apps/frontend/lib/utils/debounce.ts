/**
 * Enhanced debounce utility with cancellation support
 */
export interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel(): void
  flush(): ReturnType<T> | undefined
  pending(): boolean
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | undefined
  let maxTimeoutId: NodeJS.Timeout | undefined
  let lastCallTime: number | undefined
  let lastInvokeTime = 0
  let lastArgs: Parameters<T> | undefined
  let lastThis: any
  let result: ReturnType<T>
  let maxWait = options.maxWait
  let leading = !!options.leading
  let trailing = typeof options.trailing === 'undefined' ? true : !!options.trailing

  function invokeFunc(time: number) {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = undefined
    lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  function leadingEdge(time: number) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start timers for the trailing edge.
    timeoutId = setTimeout(timerExpired, wait)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime ?? 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = lastCallTime !== undefined ? time - lastCallTime : 0
    const timeSinceLastInvoke = time - lastInvokeTime

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxWait !== undefined && timeSinceLastInvoke >= maxWait))
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timeoutId = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time: number) {
    timeoutId = undefined

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = undefined
    lastThis = undefined
    return result
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId)
    }
    lastInvokeTime = 0
    lastArgs = undefined
    lastCallTime = undefined
    lastThis = undefined
    timeoutId = undefined
    maxTimeoutId = undefined
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now())
  }

  function pending() {
    return timeoutId !== undefined
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime)
      }
      if (maxWait !== undefined) {
        // Handle invocations in a tight loop.
        timeoutId = setTimeout(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait)
    }
    return result
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending
  return debounced
}

/**
 * Simple debounce function for common use cases
 */
export function simpleDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}