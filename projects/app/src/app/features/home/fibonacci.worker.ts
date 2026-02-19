/**
 * Web Worker that computes the nth Fibonacci number using a deliberately
 * slow recursive algorithm to simulate heavy computation.
 */
function fibonacci(n: number): number {
	if (n <= 1) return n
	return fibonacci(n - 1) + fibonacci(n - 2)
}

addEventListener("message", ({ data }: MessageEvent<number>) => {
	const result = fibonacci(data)
	postMessage(result)
})
