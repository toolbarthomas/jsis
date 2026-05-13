# JSIS Test Suite

The test suite is organized by functionality into focused test files for clarity and maintainability.

## Test Files Overview

### Core Functionality

- **`constants.test.ts`** - JSIS constants and buffer initialization
  - Charset validation
  - Type constants (BOOLEAN, FLOAT, INTEGER, STRING, etc.)
  - ArrayBuffer and DataView setup

- **`schema-create.test.ts`** - Schema creation and layout
  - Basic schema creation
  - Edge cases (zero rows, no fields, duplicates)
  - Memory layout and block allocation

- **`schema-parsing.test.ts`** - Schema parsing and serialization
  - Header parsing and reconstruction
  - Runtime schema extraction
  - Field metadata validation

### Data Operations

- **`io-operations.test.ts`** - Read/Write operations
  - Basic read/write functionality
  - Type coercion via Scope interface
  - Boundary value testing
  - String edge cases and Unicode support
  - Input validation and error handling

- **`scope.test.ts`** - Scope interface and row-based access
  - Row switching and isolation
  - Update callbacks
  - Middleware property access

- **`pointer.test.ts`** - Pointer calculations
  - Field offset computation
  - Row offset handling
  - Case-insensitive lookups

### Advanced Features

- **`advanced-features.test.ts`** - Complex scenarios
  - Multiple row operations
  - Storage provider functionality
  - Clamp functionality for floats
  - Type normalization and coercion
  - Complex field schemas
  - Large data handling

### Utilities

- **`hash.test.ts`** - Hashing functionality
  - Collision detection at various bit widths
  - Hash consistency and determinism
  - Hash distribution analysis
  - Custom parameter handling

- **`encoding.test.ts`** - Encode/Decode operations
  - Type-specific encoding
  - String, integer, float, and boolean handling
  - Type inference and validation
  - Edge cases for all types

- **`charset.test.ts`** - Charset properties
  - Character set composition
  - Uniqueness validation
  - Expected character ranges

## Running Tests

```bash
# Run all tests
npm test

# Tests are built and run with Node.js native test runner
# Output shows organized test suites with pass/fail status
```

## Test Statistics

- **Total Tests:** 282
- **Test Suites:** 63 (one per describe block)
- **Coverage:** Core functionality, edge cases, boundary conditions, error handling

## Organization Philosophy

Tests are grouped by:
1. **Functionality** - What part of JSIS is being tested
2. **Concern** - Specific aspect being validated
3. **Scenario** - Edge cases and special conditions

This structure makes it easy to:
- Locate specific test cases
- Understand test coverage at a glance
- Add new tests to the appropriate file
- Debug failures in isolation
