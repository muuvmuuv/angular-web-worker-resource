import { type ResourceRef, resource } from "@angular/core"

import { createWorkerLoader } from "./loader"
import type { WebWorkerResourceOptions } from "./types"

/**
 * A reactive web worker resource that bridges Angular's `resource()` API with Web Workers.
 *
 * Whenever the `params` signal changes, a fresh worker is spawned, the params are
 * posted as a message, and the first response is resolved as the resource value.
 * If params change while a worker is still running, the previous worker is terminated.
 *
 * @example
 * ```ts
 * // component.ts
 * readonly input = signal('hello');
 *
 * readonly result = webWorkerResource<string, string>({
 *   params: () => this.input(),
 *   worker: () => new Worker(new URL('./my.worker', import.meta.url)),
 * });
 *
 * // template
 * @if (result.hasValue()) {
 *   <p>{{ result.value() }}</p>
 * } @else if (result.isLoading()) {
 *   <p>Computing...</p>
 * } @else if (result.error()) {
 *   <p>{{ result.error() }}</p>
 * }
 * ```
 */
export function webWorkerResource<TParams, TResult>(
	options: WebWorkerResourceOptions<TParams, TResult>,
): ResourceRef<TResult | undefined>

export function webWorkerResource<TParams, TResult>(
	options: WebWorkerResourceOptions<TParams, TResult> & {
		defaultValue: NoInfer<TResult>
	},
): ResourceRef<TResult>

export function webWorkerResource<TParams, TResult>(
	options: WebWorkerResourceOptions<TParams, TResult>,
): ResourceRef<TResult | undefined> {
	return resource({
		params: options.params,
		defaultValue: options.defaultValue,
		equal: options.equal,
		injector: options.injector,
		loader: createWorkerLoader(options),
	})
}
