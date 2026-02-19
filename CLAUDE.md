# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm serve` - Run the demo application with hot reload
- `pnpm build` - Build the angular-web-worker-resource library
- `pnpm watch` - Build the library in watch mode

### Release Process

To release the library to npm:

1. `pnpm --filter=angular-web-worker-resource release` - This will:
   - Build the library with `ng build`
   - Navigate to the `dist/` folder (the built output)
   - Publish from the dist folder using `npm publish`

**Important:** The library must be published from the `dist/` folder, not the project root, because:

- Angular builds create the proper package.json with correct entry points
- The dist folder contains the compiled library code that consumers need
- The source project folder contains development files not meant for npm

### Workspace Commands

Use pnpm workspace filtering to run commands in specific projects:

- `pnpm --filter=angular-web-worker-resource <command>` - Run command in library project
- `pnpm --filter=app <command>` - Run command in demo app project
- `pnpm --filter=angular-web-worker-resource build` - Build only the library
- `pnpm --filter=app build` - Build only the demo app
- `pnpm --filter=angular-web-worker-resource exec ng <command>` - Run Angular CLI in library
- `pnpm --filter=app exec ng <command>` - Run Angular CLI in demo app

### Code Quality

- `pnpm check` - Run Biome linter to check code quality
- `pnpm format` - Format code and apply fixes with Biome

### Upgrade Workflow

- `./upgrade.fish` - Automated dependency upgrade script that:
  1. Updates Angular packages in both library and app
  2. Automatically detects and sets correct TypeScript version
  3. Installs all dependencies and resolves peer dependencies
  4. Shows remaining outdated packages

## Architecture

This is a monorepo using pnpm workspaces with two main projects:

### `/projects/angular-web-worker-resource` - Core Library

A reactive Angular resource that bridges Angular's `resource()` API with Web Workers. It provides automatic worker lifecycle management with abort/cleanup support.

#### Primary entry point (`angular-web-worker-resource`):

- **public-api.ts**: Main entry point exporting the public API (`webWorkerResource`, `WebWorkerResourceOptions`)
- **lib/types.ts**: TypeScript type definitions
  - `WebWorkerResourceOptions<TParams, TResult>` - Extends Angular's `BaseResourceOptions`, adds `worker` and `transfer`
- **lib/loader.ts**: Worker loader factory
  - `createWorkerLoader()` - Creates a loader function compatible with Angular's `resource()` API
  - Handles worker spawning, message passing, error handling, and abort/cleanup
  - Supports both envelope protocol (from `onMessage` helper) and plain `postMessage` values
- **lib/web-worker-resource.ts**: Main `webWorkerResource()` function
  - Bridges Angular's `resource()` with the worker loader
  - Provides function overloads for typed `defaultValue` support

#### Secondary entry point (`angular-web-worker-resource/worker`):

- **worker/src/on-message.ts**: Typed `onMessage<TParams, TResult>()` helper for worker files
  - Handles `addEventListener("message", ...)` / `postMessage(...)` boilerplate
  - Catches errors and reports them back via structured envelope protocol
  - Supports sync and async handlers, optional transfer function

### `/projects/app` - Demo Application

Example Angular app demonstrating library usage with a fibonacci Web Worker.

## Key Implementation Details

1. **Worker Lifecycle**:
   - A fresh worker is spawned per loader invocation
   - Workers are terminated on completion, error, or abort
   - If params change while a worker is running, the previous worker is terminated via `AbortSignal`

2. **WebWorkerResourceOptions**:
   - `params`: Reactive signal producing params sent via `postMessage` (returning `undefined` keeps idle)
   - `worker`: Factory creating a new Worker instance
   - `transfer`: Optional function deriving `Transferable[]` from params
   - `defaultValue`: Optional default value while loading or on error
   - Extends `BaseResourceOptions` from `@angular/core` (inherits `equal`, `injector`)

3. **Integration with Angular resource()**:
   - Uses Angular's `resource()` API under the hood
   - Supports all `ResourceRef` methods (`value()`, `isLoading()`, `error()`, `hasValue()`)
   - Reactive: re-runs when params signal changes

## Upgrade Process

When upgrading dependencies:

1. **Use the upgrade script**: Run `./upgrade.fish` for automated upgrades
2. **Manual process** (if needed):
   - Check outdated packages: `pnpm outdated -r`
   - Update Angular packages while maintaining version compatibility
   - Use workspace filters instead of cd: `pnpm --filter=<project> <command>`
   - Ensure TypeScript version matches Angular requirements
   - Update peer dependencies in library package.json if needed
3. **Test builds**: Always test both `pnpm build` (library) and `pnpm --filter=app build` (app)
4. **Fix peer dependency mismatches**: Add missing Angular packages to dependencies if needed
5. **Run linting**: Use `pnpm check` and `pnpm format` to check and fix issues

## Dependencies

- Angular 21+ with standalone components
- Node.js 22+ (managed via Proto tools - see `.prototools`)
- pnpm 10+ (managed via Proto tools - see `.prototools`)
- Biome for linting/formatting (configured in `biome.json`)
- TypeScript with strict mode enabled

## Development Environment

This project uses [Proto](https://moonrepo.dev/proto) for managing development tools:

- `.prototools` defines Node.js and pnpm versions
- Run `proto install` to install the correct versions
- Proto ensures all developers use consistent tool versions
- `@types/node` should match the Node.js version specified in `.prototools`
