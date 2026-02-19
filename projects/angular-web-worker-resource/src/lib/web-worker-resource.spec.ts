import { describe, expect, it, vi } from "vitest"

const mockResource = vi.fn().mockReturnValue({ value: () => undefined })

vi.mock("@angular/core", () => ({ resource: mockResource }))

const mockLoader = vi.fn()
vi.mock("./loader", () => ({
	createWorkerLoader: vi.fn(() => mockLoader),
}))

const { webWorkerResource } = await import("./web-worker-resource")
const { createWorkerLoader } = await import("./loader")

describe("webWorkerResource", () => {
	it("delegates to Angular resource() with worker loader", () => {
		const params = () => 42
		const options = { worker: () => new Worker("test.js"), params }

		webWorkerResource(options)

		expect(createWorkerLoader).toHaveBeenCalledWith(options)
		expect(mockResource).toHaveBeenCalledWith(
			expect.objectContaining({ params, loader: mockLoader }),
		)
	})

	it("forwards defaultValue, equal, and injector", () => {
		const equal = (a: number, b: number) => a === b
		const injector = {} as never
		const options = {
			worker: () => new Worker("test.js"),
			params: () => 1,
			defaultValue: 0,
			equal,
			injector,
		}

		webWorkerResource(options)

		expect(mockResource).toHaveBeenCalledWith(
			expect.objectContaining({ defaultValue: 0, equal, injector }),
		)
	})
})
