# @zenbakiak/skillet-node

Node.js bindings for the Skillet micro expression language, powered by Rust and napi-rs.

- Fast, native N-API addon for Node.js
- Unified API with automatic method selection for optimal performance
- Support for variables and custom JavaScript functions
- Built on the core `skillet` Rust crate

## Install

```bash
npm install @zenbakiak/skillet-node
```

This package ships prebuilds via `@napi-rs/cli`. If you are building locally from source:

```bash
npm run build
```

## Usage

### Quick Start

The simplest way to use Skillet is with the unified `evaluate` function, which automatically chooses the optimal evaluation method:

```javascript
import { evaluate } from '@zenbakiak/skillet-node'

// Simple formulas
const result = await evaluate('= 2 + 3 * 4')
console.log(result) // 14

// With variables
const total = await evaluate('= SUM(:a, :b)', { a: 10, b: 5 })
console.log(total) // 15
```

### Basic Formula Evaluation

Skillet supports standard mathematical operations and built-in functions:

```javascript
import { evaluate } from '@zenbakiak/skillet-node'

// Arithmetic operations
await evaluate('= 10 + 5 * 2')        // 20
await evaluate('= (10 + 5) * 2')      // 30
await evaluate('= 100 / 4')           // 25
await evaluate('= 2 ^ 3')             // 8

// Built-in functions
await evaluate('= ABS(-42)')          // 42
await evaluate('= MAX(1, 5, 3)')      // 5
await evaluate('= MIN(1, 5, 3)')      // 1
await evaluate('= ROUND(3.14159, 2)') // 3.14
```

### Working with Variables

Use the `:variable` syntax to reference values passed as the second parameter:

```javascript
import { evaluate } from '@zenbakiak/skillet-node'

// Single variables
const price = await evaluate('= :cost * 1.08', { cost: 100 })
console.log(price) // 108

// Multiple variables
const invoice = await evaluate('= :price * (1 + :tax) * :quantity', {
  price: 25.99,
  tax: 0.08,
  quantity: 3
})
console.log(invoice.toFixed(2)) // 84.21

// Variables with built-in functions
const summary = await evaluate('= SUM(:sales, :shipping) - :discount', {
  sales: 150.00,
  shipping: 12.50,
  discount: 25.00
})
console.log(summary) // 137.5
```

### Custom JavaScript Functions

Register your own functions that can be called from formulas:

```javascript
import { evaluate, registerJsFunction, unregisterFunction } from '@zenbakiak/skillet-node'

// Register a simple function
registerJsFunction('DOUBLE', function(args, argsArray, resolve) {
  const value = Array.isArray(argsArray) ? argsArray[0] : 0
  resolve(Number(value) * 2)
}, 1, 1) // min 1 arg, max 1 arg

// Use the custom function
const doubled = await evaluate('= DOUBLE(:value)', { value: 21 })
console.log(doubled) // 42

// Register a more complex function
registerJsFunction('COMPOUND_INTEREST', function(args, argsArray, resolve) {
  const [principal, rate, time] = argsArray || [0, 0, 0]
  const result = principal * Math.pow(1 + rate, time)
  resolve(result)
}, 3, 3) // exactly 3 arguments

// Calculate compound interest
const investment = await evaluate('= COMPOUND_INTEREST(:principal, :rate, :years)', {
  principal: 1000,
  rate: 0.05,
  years: 10
})
console.log(investment.toFixed(2)) // 1628.89

// Clean up when done
unregisterFunction('DOUBLE')
unregisterFunction('COMPOUND_INTEREST')
```

### Advanced Examples

#### Mixing Custom Functions with Built-ins

```javascript
// Register a custom function that returns the current date
registerJsFunction('TODAY', function(args, argsArray, resolve) {
  resolve(new Date().toISOString().split('T')[0])
}, 0, 0)

// Register a function that calculates business days
registerJsFunction('BUSINESS_DAYS', function(args, argsArray, resolve) {
  const days = argsArray[0] || 0
  // Simple approximation: exclude weekends (2/7 of days)
  resolve(Math.round(days * 5/7))
}, 1, 1)

// Use them together
const deadline = await evaluate('= "Project due in " + BUSINESS_DAYS(:totalDays) + " business days from " + TODAY()', {
  totalDays: 14
})
console.log(deadline) // "Project due in 10 business days from 2024-01-15"
```

#### Financial Calculations

```javascript
// Register financial functions
registerJsFunction('PMT', function(args, argsArray, resolve) {
  const [rate, nper, pv] = argsArray || [0, 0, 0]
  const pmt = pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1)
  resolve(-pmt) // Negative because it's a payment
}, 3, 3)

// Calculate monthly mortgage payment
const monthlyPayment = await evaluate('= PMT(:monthlyRate, :months, :loanAmount)', {
  monthlyRate: 0.04 / 12, // 4% annual rate
  months: 30 * 12,        // 30 years
  loanAmount: 300000      // $300,000 loan
})
console.log(`Monthly payment: $${monthlyPayment.toFixed(2)}`) // Monthly payment: $1432.25
```

## API Reference

### Unified API (Recommended)

- `evaluate(formula: string, vars?: Record<string, any>): Promise<any>` - Automatically chooses the optimal evaluation method based on the presence of variables and custom functions.

### Direct Methods (Advanced Usage)

- `evalFormula(formula: string): any` - Evaluate simple formulas without variables
- `evalFormulaWith(formula: string, vars?: Record<string, any>): any` - Evaluate formulas with variables
- `evalFormulaWithCustom(formula: string, vars?: Record<string, any>): Promise<any>` - Evaluate formulas with custom functions (async)

### Custom Functions

- `registerJsFunction(name: string, fn: Function, minArgs?: number, maxArgs?: number): void` - Register a custom JavaScript function
- `unregisterFunction(name: string): boolean` - Remove a custom function
- `listCustomFunctions(): string[]` - List all registered custom functions

#### Custom Function Signature

Custom functions receive three parameters:
1. `args` - Currently null (reserved for future use)
2. `argsArray` - Array containing the actual arguments passed to the function
3. `resolve` - Callback function to return the result: `resolve(value)`

```javascript
registerJsFunction('FUNCTION_NAME', function(args, argsArray, resolve) {
  const [firstArg, secondArg] = argsArray || []
  // Your logic here
  resolve(result)
}, minArgs, maxArgs)
```

### Utility Functions

- `version(): string` - Get the version of the Skillet engine

## Data Types

Values are returned as plain JavaScript types:
- Numbers: `42`, `3.14`
- Strings: `"hello world"`
- Booleans: `true`, `false`
- Null: `null`
- Arrays: `[1, 2, 3]`

For functions returning JSON, the binding attempts to parse JSON strings automatically.

## Example File

See `example-usage.js` in this package for a complete working example demonstrating all features.

## Development

This repo is intentionally separate from the core `skillet` crate. During local development, the Rust dependency points to `..` in `Cargo.toml`:

```
skillet = { path = ".." }
```

When moving this directory to its own repository, update it to a crates.io version (e.g. `skillet = "=0.0.1"`).

## Publishing

1. Ensure `@napi-rs/cli` is installed (dev dependency present).
2. Build prebuilds: `npm run build` (or `napi build --platform`).
3. Publish: `npm publish`.

Prebuilds are required for a smooth install experience across OS/arch. See https://napi.rs for details.

## License

MIT
