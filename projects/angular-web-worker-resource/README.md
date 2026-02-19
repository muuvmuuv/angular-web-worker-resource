# Angular Web Worker Resource

A reactive Angular resource that bridges Angular's `resource()` API with Web Workers. Whenever the params signal changes, a fresh worker is spawned, the params are posted as a message, and the first response is resolved as the resource value. If params change while a worker is still running, the previous worker is terminated.

```shell
pnpm add angular-web-worker-resource
```

> [!TIP]
> Zero dependencies, automatic worker lifecycle management, and full `ResourceRef` support.

- [Installation](#installation)
- [Usage](#usage)
- [Worker Helper](#worker-helper)
- [API](#api)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

```shell
pnpm add angular-web-worker-resource
```

## Usage

### Component

```typescript
import { signal } from "@angular/core";
import { webWorkerResource } from "angular-web-worker-resource";

@Component({
	/* ... */
})
export class MyComponent {
	readonly input = signal(40);

	readonly result = webWorkerResource<number, number>({
		params: () => this.input(),
		worker: () => new Worker(new URL("./fibonacci.worker", import.meta.url)),
		defaultValue: 0,
	});
}
```

```html
@if (result.isLoading()) {
<p>Computing...</p>
} @else if (result.error(); as error) {
<p>Error: {{ error }}</p>
} @else {
<p>Result: {{ result.value() }}</p>
}
```

### Worker (with helper)

```typescript
// fibonacci.worker.ts
import { onMessage } from "angular-web-worker-resource/worker";

function fibonacci(n: number): number {
	if (n <= 1) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

onMessage<number, number>((n) => fibonacci(n));
```

### Worker (plain)

You can also write workers without the helper. Plain `postMessage` values are supported:

```typescript
// fibonacci.worker.ts
addEventListener("message", ({ data }: MessageEvent<number>) => {
	const result = fibonacci(data);
	postMessage(result);
});
```

### Without params

Workers that don't need input params run once immediately. Use `.reload()` to re-trigger:

```typescript
readonly uuid = webWorkerResource<void, string>({
	worker: () => new Worker(new URL("./uuid.worker", import.meta.url)),
})
```

## Worker Helper

The `angular-web-worker-resource/worker` entry point provides a typed `onMessage` helper for the worker side:

```typescript
import { onMessage } from "angular-web-worker-resource/worker"

onMessage<TParams, TResult>(handler, transfer?)
```

- **Typed** -- `handler` receives `TParams` and must return `TResult | Promise<TResult>`
- **Error handling** -- exceptions are caught and reported back to the main thread, surfacing through `resource().error()`
- **Async support** -- the handler can be `async` or return a `Promise`
- **Transfer support** -- optional second argument derives `Transferable[]` from the result

## API

### `webWorkerResource<TParams, TResult>(options)`

Creates a reactive resource backed by a Web Worker.

Extends Angular's [`BaseResourceOptions`](https://angular.dev/api/core/BaseResourceOptions), so all base options are supported.

#### Options

| Property       | Type                                  | Required | Description                                                                 |
| -------------- | ------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `params`       | `() => TParams \| undefined`          | No       | Reactive computation producing params. Returning `undefined` keeps it idle. |
| `worker`       | `() => Worker`                        | Yes      | Factory that creates a new Worker instance per invocation.                  |
| `transfer`     | `(params: TParams) => Transferable[]` | No       | Derive transferable objects from params.                                    |
| `defaultValue` | `TResult`                             | No       | Default value while loading or on error.                                    |
| `equal`        | `(a: TResult, b: TResult) => boolean` | No       | Custom equality function for the result value.                              |
| `injector`     | `Injector`                            | No       | Overrides the injector used by the resource.                                |

> [!NOTE]
> When `params` is omitted, the worker runs once immediately and won't rerun unless `.reload()` is called.

#### Returns

`ResourceRef<TResult | undefined>` (or `ResourceRef<TResult>` when `defaultValue` is provided).

### `onMessage<TParams, TResult>(handler, transfer?)`

Registers a typed message handler in a Web Worker context. Import from `angular-web-worker-resource/worker`.

| Parameter  | Type                                               | Description                                   |
| ---------- | -------------------------------------------------- | --------------------------------------------- |
| `handler`  | `(params: TParams) => TResult \| Promise<TResult>` | Sync or async function that processes params. |
| `transfer` | `(result: TResult) => Transferable[]`              | Optional function to derive transferables.    |

## Error Handling

When using the `onMessage` helper, errors thrown by the handler are automatically caught and reported back to the main thread. The error surfaces through `resource().error()`:

```typescript
// worker
onMessage<string, string>((url) => {
	const res = await fetch(url)
	if (!res.ok) throw new Error(`HTTP ${res.status}`)
	return res.json()
})

// component template
@if (result.error(); as error) {
	<p>{{ error }}</p>
}
```

Workers without the helper can still report errors via the standard `onerror` event, but error messages are limited to what the browser provides.

## Examples

For a full example project, see [`projects/app/`](projects/app/).
