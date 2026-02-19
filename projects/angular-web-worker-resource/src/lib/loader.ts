import type { WebWorkerResourceOptions } from "./types"

/**
 * Creates a loader function compatible with Angular's `resource()` API
 * that delegates work to a Web Worker.
 *
 * The loader spawns a fresh worker for each invocation, posts the params,
 * and resolves with the first message received. The worker is terminated
 * on completion, error, or abort.
 */
export function createWorkerLoader<TParams, TResult>(
	options: WebWorkerResourceOptions<TParams, TResult>,
): (args: { params: TParams; abortSignal: AbortSignal }) => Promise<TResult> {
	return ({ params, abortSignal }) => {
		return new Promise<TResult>((resolve, reject) => {
			const worker = options.worker()

			const cleanup = () => {
				worker.terminate()
			}

			// If already aborted before we even start
			if (abortSignal.aborted) {
				cleanup()
				reject(new DOMException("Worker aborted", "AbortError"))
				return
			}

			abortSignal.addEventListener(
				"abort",
				() => {
					cleanup()
					reject(new DOMException("Worker aborted", "AbortError"))
				},
				{ once: true },
			)

			worker.onmessage = ({ data }: MessageEvent<TResult>) => {
				cleanup()
				resolve(data)
			}

			worker.onerror = (event) => {
				cleanup()
				reject(new Error(event.message || "Worker error"))
			}

			worker.onmessageerror = () => {
				cleanup()
				reject(new Error("Worker message could not be deserialized"))
			}

			const transfer = options.transfer?.(params) ?? []
			worker.postMessage(params, transfer)
		})
	}
}
