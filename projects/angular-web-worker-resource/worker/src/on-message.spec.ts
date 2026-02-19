import { beforeEach, describe, expect, it, vi } from "vitest"

let capturedListener: ((event: MessageEvent) => void) | undefined

const addEventListenerSpy = vi.fn(
	(_type: string, listener: (event: MessageEvent) => void) => {
		capturedListener = listener
	},
)
const postMessageSpy = vi.fn()

vi.stubGlobal("addEventListener", addEventListenerSpy)
vi.stubGlobal("postMessage", postMessageSpy)

const { onMessage } = await import("./on-message")

function simulateIncomingMessage<T>(data: T) {
	capturedListener?.(new MessageEvent("message", { data }))
}

async function flushPromiseChain() {
	for (let i = 0; i < 5; i++) {
		await new Promise<void>((resolve) => {
			queueMicrotask(resolve)
		})
	}
}

describe("onMessage", () => {
	beforeEach(() => {
		capturedListener = undefined
		addEventListenerSpy.mockClear()
		postMessageSpy.mockClear()
	})

	it("posts success envelope for sync handler", async () => {
		onMessage((n: number) => n * 2)

		simulateIncomingMessage(21)
		await flushPromiseChain()

		expect(postMessageSpy).toHaveBeenCalledWith(
			{ ok: true, value: 42 },
			{ transfer: [] },
		)
	})

	it("posts success envelope for async handler", async () => {
		onMessage((s: string) => Promise.resolve(`hello ${s}`))

		simulateIncomingMessage("world")
		await flushPromiseChain()

		expect(postMessageSpy).toHaveBeenCalledWith(
			{ ok: true, value: "hello world" },
			{ transfer: [] },
		)
	})

	it("posts error envelope when handler throws", async () => {
		onMessage(() => {
			throw new Error("computation failed")
		})

		simulateIncomingMessage("input")
		await flushPromiseChain()

		expect(postMessageSpy).toHaveBeenCalledWith({
			ok: false,
			error: "computation failed",
		})
	})

	it("includes transfer objects when transfer function provided", async () => {
		const buffer = new ArrayBuffer(8)
		onMessage(
			() => buffer,
			(result) => [result],
		)

		simulateIncomingMessage("input")
		await flushPromiseChain()

		expect(postMessageSpy).toHaveBeenCalledWith(
			{ ok: true, value: buffer },
			{ transfer: [buffer] },
		)
	})
})
