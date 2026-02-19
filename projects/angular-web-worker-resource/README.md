# Angular Web Worker Resource

A reactive Angular resource that bridges Angular's `resource()` API with Web Workers. Whenever the params signal changes, a fresh worker is spawned, the params are posted as a message, and the first response is resolved as the resource value. If params change while a worker is still running, the previous worker is terminated.

```shell
pnpm add angular-web-worker-resource
```

> [!TIP]
> Zero dependencies, automatic worker lifecycle management, and full `ResourceRef` support.

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Examples](#examples)

## Installation

```shell
pnpm add angular-web-worker-resource
```

## Usage

```typescript
import { signal } from "@angular/core"
import { webWorkerResource } from "angular-web-worker-resource"

// In your component:
readonly input = signal("hello")

readonly result = webWorkerResource<string, string>({
	params: () => this.input(),
	worker: () => new Worker(new URL("./my.worker", import.meta.url)),
})
```

```html
@if (result.hasValue()) {
	<p>{{ result.value() }}</p>
} @else if (result.isLoading()) {
	<p>Computing...</p>
} @else if (result.error()) {
	<p>{{ result.error() }}</p>
}
```

## API

### `webWorkerResource<TParams, TResult>(options)`

Creates a reactive resource backed by a Web Worker.

#### Options

| Property       | Type                              | Required | Description                                                                 |
| -------------- | --------------------------------- | -------- | --------------------------------------------------------------------------- |
| `params`       | `() => TParams \| undefined`     | Yes      | Reactive computation producing params. Returning `undefined` keeps it idle. |
| `worker`       | `() => Worker`                    | Yes      | Factory that creates a new Worker instance per invocation.                  |
| `transfer`     | `(params: TParams) => Transferable[]` | No  | Derive transferable objects from params.                                    |
| `defaultValue` | `TResult`                         | No       | Default value while loading or on error.                                    |

#### Returns

`ResourceRef<TResult | undefined>` (or `ResourceRef<TResult>` when `defaultValue` is provided).

### Worker File

Your worker file should listen for messages and post back a result:

```typescript
// my.worker.ts
addEventListener("message", ({ data }) => {
	const result = doHeavyComputation(data)
	postMessage(result)
})
```

## Examples

For a full example project, see `projects/app/`.
