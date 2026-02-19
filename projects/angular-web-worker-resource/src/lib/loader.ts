import type { WebWorkerResourceOptions } from "./types"

/**
 * Shape of a structured message sent by the `onMessage` helper from
 * `angular-web-worker-resource/worker`. Plain workers that post raw
 * values directly are also supported.
 */
type WorkerEnvelope<T> = { ok: true; value: T } | { ok: false; error: string }

function isEnvelope<T>(data: unknown): data is WorkerEnvelope<T> {
	return (
		typeof data === "object" &&
		data !== null &&
		"ok" in data &&
		typeof (data as Record<string, unknown>).ok === "boolean"
	)
}

/**
 * Creates a loader function compatible with Angular's `resource()` API
 * that delegates work to a Web Worker.
 *
 * The loader spawns a fresh worker for each invocation, posts the params,
 * and resolves with the first message received. The worker is terminated
 * on completion, error, or abort.
 *
 * Supports two message formats:
 * - **Envelope** (from `onMessage` helper): `{ ok: true, value }` or `{ ok: false, error }`
 * - **Plain**: raw value posted directly via `postMessage(result)`
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

			worker.onmessage = ({ data }: MessageEvent<unknown>) => {
				cleanup()
				if (isEnvelope<TResult>(data)) {
					if (data.ok) {
						resolve(data.value)
					} else {
						reject(new Error(data.error))
					}
				} else {
					// Plain message from a hand-written worker
					resolve(data as TResult)
				}
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
