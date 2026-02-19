/**
 * Registers a typed message handler in a Web Worker context.
 *
 * Handles the `addEventListener("message", ...)` / `postMessage(...)` boilerplate
 * with proper typing. The handler receives the deserialized params and its return
 * value (or resolved Promise) is automatically posted back as the result.
 *
 * Errors thrown by the handler are caught and reported back to the main thread
 * as a structured error message, which the resource loader rejects with.
 *
 * @typeParam TParams - The type of params received from the main thread.
 * @typeParam TResult - The type of the result sent back to the main thread.
 *
 * @param handler - A sync or async function that processes the params and returns the result.
 * @param transfer - Optional function to derive `Transferable[]` from the result before posting.
 *
 * @example
 * ```ts
 * // fibonacci.worker.ts
 * import { onMessage } from "angular-web-worker-resource/worker"
 *
 * onMessage<number, number>((n) => {
 *   function fib(n: number): number {
 *     return n <= 1 ? n : fib(n - 1) + fib(n - 2)
 *   }
 *   return fib(n)
 * })
 * ```
 *
 * @example
 * ```ts
 * // fetch.worker.ts
 * import { onMessage } from "angular-web-worker-resource/worker"
 *
 * onMessage<string, Response>(async (url) => {
 *   const res = await fetch(url)
 *   return res.json()
 * })
 * ```
 */
export function onMessage<TParams, TResult>(
	handler: (params: TParams) => TResult | Promise<TResult>,
	transfer?: (result: TResult) => Transferable[],
): void {
	addEventListener("message", (event: MessageEvent<TParams>) => {
		Promise.resolve(event.data)
			.then((params) => handler(params))
			.then((result) => {
				const transferables = transfer?.(result) ?? []
				postMessage({ ok: true, value: result }, { transfer: transferables })
			})
			.catch((error: unknown) => {
				const message = error instanceof Error ? error.message : String(error)
				postMessage({ ok: false, error: message })
			})
	})
}
