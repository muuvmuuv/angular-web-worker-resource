import type { BaseResourceOptions } from "@angular/core"

/**
 * Options for configuring a web worker resource.
 *
 * Extends Angular's `BaseResourceOptions` to inherit `defaultValue`,
 * `equal`, and `injector` options, and adds worker-specific configuration.
 *
 * @typeParam TParams - The type of params sent to the worker via `postMessage`.
 * @typeParam TResult - The type of the result received from the worker's `onmessage`.
 */
export interface WebWorkerResourceOptions<TParams, TResult>
	extends Omit<BaseResourceOptions<TResult, TParams>, "params"> {
	/**
	 * Reactive computation that produces the params sent to the worker via postMessage.
	 * Returning `undefined` keeps the resource idle (worker won't be invoked).
	 */
	params: () => TParams | undefined

	/**
	 * Factory that creates a new Worker instance.
	 * Called once per loader invocation so the worker can be terminated on abort.
	 *
	 * @example () => new Worker(new URL('./heavy-calc.worker', import.meta.url))
	 */
	worker: () => Worker

	/**
	 * Optional transfer objects to pass alongside the message.
	 * Receives the current params value so you can derive transferables from it.
	 */
	transfer?: (params: TParams) => Transferable[]
}
