import { resource, ResourceOptions, ResourceRef } from '@angular/core';

type WebWorkerResourceOptions<TParams, TResult> = {
  /**
   * Reactive computation that produces the params sent to the worker via postMessage.
   * Returning `undefined` keeps the resource idle (worker won't be invoked).
   */
  params: () => TParams | undefined;

  /**
   * Factory that creates a new Worker instance.
   * Called once per loader invocation so the worker can be terminated on abort.
   *
   * @example () => new Worker(new URL('./heavy-calc.worker', import.meta.url))
   */
  worker: () => Worker;

  /**
   * Optional transfer objects to pass alongside the message.
   * Receives the current params value so you can derive transferables from it.
   */
  transfer?: (params: TParams) => Transferable[];

  /**
   * Optional default value while loading or on error.
   */
  defaultValue?: NoInfer<TResult>;
};

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
 *   <p>Computing…</p>
 * } @else if (result.error()) {
 *   <p>{{ result.error() }}</p>
 * }
 * ```
 */
export function webWorkerResource<TParams, TResult>(
  options: WebWorkerResourceOptions<TParams, TResult>,
): ResourceRef<TResult | undefined>;

export function webWorkerResource<TParams, TResult>(
  options: WebWorkerResourceOptions<TParams, TResult> & { defaultValue: NoInfer<TResult> },
): ResourceRef<TResult>;

export function webWorkerResource<TParams, TResult>(
  options: WebWorkerResourceOptions<TParams, TResult>,
): ResourceRef<TResult | undefined> {
  const resourceOptions: ResourceOptions<TResult, TParams> = {
    params: options.params,
    loader: ({ params, abortSignal }) => {
      return new Promise<TResult>((resolve, reject) => {
        const worker = options.worker();

        const cleanup = () => {
          worker.terminate();
        };

        // If already aborted before we even start
        if (abortSignal.aborted) {
          cleanup();
          reject(new DOMException('Worker aborted', 'AbortError'));
          return;
        }

        abortSignal.addEventListener('abort', () => {
          cleanup();
          reject(new DOMException('Worker aborted', 'AbortError'));
        }, { once: true });

        worker.onmessage = ({ data }: MessageEvent<TResult>) => {
          cleanup();
          resolve(data);
        };

        worker.onerror = (event) => {
          cleanup();
          reject(new Error(event.message || 'Worker error'));
        };

        worker.onmessageerror = () => {
          cleanup();
          reject(new Error('Worker message could not be deserialized'));
        };

        const transfer = options.transfer?.(params) ?? [];
        worker.postMessage(params, transfer);
      });
    },
  };

  if ('defaultValue' in options) {
    (resourceOptions as ResourceOptions<TResult, TParams> & { defaultValue: TResult }).defaultValue =
      options.defaultValue as TResult;
  }

  return resource(resourceOptions);
}
