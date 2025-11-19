# Multiple Instance Support - Summary

## What Changed

The App component now supports **multiple isolated instances**, allowing you to create separate genome browsers that don't share state.

## Key Changes

### 1. New Store Factory (`createStore.ts`)

- Replaces singleton store with a factory function
- Creates isolated Redux stores for each App instance
- Each store can have unique persistence key

### 2. New AppProvider Component (`AppProvider.tsx`)

- Wraps Redux Provider with store creation logic
- Accepts `storeConfig` prop for customization
- Memoizes store to prevent recreation

### 3. Updated App Component (`App.tsx`)

- Now accepts `storeConfig` prop
- Supports TypeScript interfaces for better DX
- Backward compatible - works without storeConfig

### 4. Enhanced Exports (`index.ts`)

- Exports all necessary types and utilities
- Allows advanced use cases with direct store access

## Usage

### Single Instance (Default - No Changes Needed)

```tsx
import { GenomeHub } from "your-package";

function MyApp() {
  return <GenomeHub />;
}
```

### Multiple Isolated Instances

```tsx
import { GenomeHub } from "your-package";

function MyApp() {
  return (
    <div>
      <GenomeHub storeConfig={{ storeId: "genome-1" }} />
      <GenomeHub storeConfig={{ storeId: "genome-2" }} />
    </div>
  );
}
```

## Benefits

1. **State Isolation**: Each instance has completely separate state
2. **Independent Persistence**: Each instance saves to its own localStorage key
3. **No Interference**: Sessions, genomes, and settings don't mix between instances
4. **Backward Compatible**: Existing code continues to work without changes
5. **Type Safe**: Full TypeScript support with proper interfaces

## Files Modified

- `src/App.tsx` - Updated to accept storeConfig
- `src/lib/redux/store.ts` - Deprecated with warning, kept for compatibility
- `src/index.ts` - Enhanced exports

## Files Added

- `src/lib/redux/createStore.ts` - Store factory function
- `src/lib/redux/AppProvider.tsx` - New provider component
- `MULTIPLE_INSTANCES.md` - Comprehensive documentation
- `examples/MultipleGenomeHubs.tsx` - Live example

## Migration Guide

### For Package Consumers

No migration needed! The default behavior is unchanged:

```tsx
// This still works exactly as before
<GenomeHub />
```

To use multiple instances, just add storeConfig:

```tsx
<GenomeHub storeConfig={{ storeId: "unique-id" }} />
```

### For Internal Development

The old `ReduxProvider` and singleton `store` are deprecated but still work. New code should use `AppProvider` and `createAppStore()`.

## Testing

Test both scenarios:

1. **Single instance**: Ensure backward compatibility
2. **Multiple instances**: Verify state isolation

```tsx
// Test 1: Single instance
const TestSingle = () => <GenomeHub />;

// Test 2: Multiple instances
const TestMultiple = () => (
  <>
    <GenomeHub storeConfig={{ storeId: "test-1" }} />
    <GenomeHub storeConfig={{ storeId: "test-2" }} />
  </>
);
```

## Future Enhancements

Possible improvements:

1. **Store Communication**: Add pub/sub for cross-instance messaging
2. **Shared State Layer**: Optional shared layer for common data
3. **Store Manager**: Centralized manager for all store instances
4. **Memory Optimization**: Lazy loading and store disposal

## Questions?

See `MULTIPLE_INSTANCES.md` for detailed documentation and examples.
