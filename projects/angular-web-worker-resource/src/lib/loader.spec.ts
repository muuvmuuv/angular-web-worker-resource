import { describe, expect, it, type Mock, vi } from "vitest"

import { createWorkerLoader } from "./loader"
import type { WebWorkerResourceOptions } from "./types"

class MockWorker {
	onmessage: ((event: MessageEvent) => void) | null = null
	onerror: ((event: ErrorEvent) => void) | null = null
	onmessageerror: (() => void) | null = null
	terminate: Mock = vi.fn()
	postMessage: Mock = vi.fn()

	simulateMessage(data: unknown) {
		this.onmessage?.(new MessageEvent("message", { data }))
	}

	simulateError(message = "Worker error") {
		this.onerror?.({ message } as ErrorEvent)
	}
}

function createMockOptions<TParams, TResult>(
	overrides: Partial<WebWorkerResourceOptions<TParams, TResult>> = {},
) {
	const worker = new MockWorker()
	const options = {
		worker: () => worker as unknown as Worker,
		...overrides,
	} as WebWorkerResourceOptions<TParams, TResult>
	return { worker, options }
}

describe("createWorkerLoader", () => {
	it("resolves with envelope value and terminates worker", async () => {
		const { worker, options } = createMockOptions<number, string>()
		const loader = createWorkerLoader(options)
		const controller = new AbortController()

		const promise = loader({ params: 42, abortSignal: controller.signal })
		worker.simulateMessage({ ok: true, value: "result" })

		await expect(promise).resolves.toBe("result")
		expect(worker.terminate).toHaveBeenCalledOnce()
	})

	it("rejects on error envelope", async () => {
		const { worker, options } = createMockOptions<number, string>()
		const loader = createWorkerLoader(options)
		const controller = new AbortController()

		const promise = loader({ params: 42, abortSignal: controller.signal })
		worker.simulateMessage({ ok: false, error: "computation failed" })

		await expect(promise).rejects.toThrow("computation failed")
	})

	it("resolves with raw value for plain (non-envelope) messages", async () => {
		const { worker, options } = createMockOptions<number, string>()
		const loader = createWorkerLoader(options)
		const controller = new AbortController()

		const promise = loader({ params: 42, abortSignal: controller.signal })
		worker.simulateMessage("raw result")

		await expect(promise).resolves.toBe("raw result")
	})

	it("posts params with transfer objects", async () => {
		const buffer = new ArrayBuffer(8)
		const { worker, options } = createMockOptions<ArrayBuffer, string>({
			transfer: (params) => [params],
		})
		const loader = createWorkerLoader(options)
		const controller = new AbortController()

		const promise = loader({ params: buffer, abortSignal: controller.signal })
		expect(worker.postMessage).toHaveBeenCalledWith(buffer, [buffer])

		worker.simulateMessage({ ok: true, value: "done" })
		await promise
	})

	it("rejects and terminates on pre-aborted signal", async () => {
		const { worker, options } = createMockOptions<number, string>()
		const controller = new AbortController()
		controller.abort()

		const loader = createWorkerLoader(options)
		const promise = loader({ params: 42, abortSignal: controller.signal })

		await expect(promise).rejects.toThrow("Worker aborted")
		expect(worker.terminate).toHaveBeenCalledOnce()
		expect(worker.postMessage).not.toHaveBeenCalled()
	})

	it("rejects and terminates when aborted during execution", async () => {
		const { worker, options } = createMockOptions<number, string>()
		const controller = new AbortController()

		const loader = createWorkerLoader(options)
		const promise = loader({ params: 42, abortSignal: controller.signal })
		controller.abort()

		await expect(promise).rejects.toThrow("Worker aborted")
		expect(worker.terminate).toHaveBeenCalledOnce()
	})

	it("rejects on worker error", async () => {
		const { worker, options } = createMockOptions<number, string>()
		const loader = createWorkerLoader(options)
		const controller = new AbortController()

		const promise = loader({ params: 42, abortSignal: controller.signal })
		worker.simulateError("Script error")

		await expect(promise).rejects.toThrow("Script error")
		expect(worker.terminate).toHaveBeenCalledOnce()
	})
})
