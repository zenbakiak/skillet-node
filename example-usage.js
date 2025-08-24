// Example usage of the Skillet Node.js bindings with the unified evaluate function

const { evaluate, registerJsFunction, unregisterFunction } = require('./wrapper.js')

async function main() {
  console.log('Skillet Node.js Example Usage')
  console.log('==============================\n')

  // Example 1: Simple formula evaluation
  console.log('1. Simple formula evaluation:')
  const simple = await evaluate('= 2 + 3 * 4')
  console.log('  evaluate("= 2 + 3 * 4") =', simple)
  console.log()

  // Example 2: Formula with variables
  console.log('2. Formula with variables:')
  const withVars = await evaluate('= SUM(:a, :b, :c)', { a: 10, b: 20, c: 30 })
  console.log('  evaluate("= SUM(:a, :b, :c)", { a: 10, b: 20, c: 30 }) =', withVars)
  console.log()

  // Example 3: More complex formula with variables
  console.log('3. Complex formula with variables:')
  const complex = await evaluate('= :price * (1 + :taxRate) * :quantity', {
    price: 25.99,
    taxRate: 0.08,
    quantity: 3
  })
  console.log('  evaluate("= :price * (1 + :taxRate) * :quantity", {...}) =', complex)
  console.log()

  // Example 4: Custom JavaScript functions
  console.log('4. Custom JavaScript functions:')
  
  // Register a custom function that doubles a number
  registerJsFunction('DOUBLE', function(args, argsArray, resolve) {
    const value = Array.isArray(argsArray) ? argsArray[0] : 0
    resolve(Number(value) * 2)
  }, 1, 1)

  // Register a custom function that calculates compound interest
  registerJsFunction('COMPOUND_INTEREST', function(args, argsArray, resolve) {
    const [principal, rate, time] = argsArray || [0, 0, 0]
    const result = principal * Math.pow(1 + rate, time)
    resolve(result)
  }, 3, 3)

  // Use the custom functions
  const doubled = await evaluate('= DOUBLE(:value)', { value: 21 })
  console.log('  evaluate("= DOUBLE(:value)", { value: 21 }) =', doubled)

  const interest = await evaluate('= COMPOUND_INTEREST(:principal, :rate, :years)', {
    principal: 1000,
    rate: 0.05,
    years: 10
  })
  console.log('  evaluate("= COMPOUND_INTEREST(:principal, :rate, :years)", {...}) =', interest.toFixed(2))
  console.log()

  // Example 5: Mixed operations with custom functions
  console.log('5. Mixed operations with custom functions:')
  const mixed = await evaluate('= DOUBLE(:base) + SUM(:a, :b)', {
    base: 15,
    a: 5,
    b: 10
  })
  console.log('  evaluate("= DOUBLE(:base) + SUM(:a, :b)", {...}) =', mixed)
  console.log()

  // Example 6: Custom function without variables
  console.log('6. Custom function without variables:')
  registerJsFunction('GET_PI', function(args, argsArray, resolve) {
    resolve(Math.PI)
  }, 0, 0)

  const pi = await evaluate('= GET_PI() * 2')
  console.log('  evaluate("= GET_PI() * 2") =', pi)
  console.log()

  // Clean up custom functions
  unregisterFunction('DOUBLE')
  unregisterFunction('COMPOUND_INTEREST')
  unregisterFunction('GET_PI')

  console.log('Example completed successfully!')
}

// Run the example
main().catch(console.error)