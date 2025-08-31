// Example: Using @skillet-lang/node in a Node.js application
// This demonstrates the Skillet micro expression language bindings

const {
  version,
  evaluate,
  registerJsFunction,
  listCustomFunctions
} = require('./wrapper.js')

async function runExamples() {
console.log('=== Skillet Node.js Example ===')
console.log('Version:', version())

// 1. Basic formula evaluation
console.log('\n--- Basic Formula Evaluation ---')
const basicResult = await evaluate('=2 + 3 * 4')
console.log('2 + 3 * 4 =', basicResult) // 14

const mathResult = await evaluate('=SQRT(16) + POW(2, 3)')
console.log('SQRT(16) + POW(2, 3) =', mathResult) // 12

// 2. Formula evaluation with variables
console.log('\n--- With Variables ---')
const withVars = await evaluate('=SUM(:a, :b, :c)', { a: 10, b: 5, c: 3 })
console.log('SUM(10, 5, 3) =', withVars) // 18

const stringConcat = await evaluate('=CONCAT(:firstName, " ", :lastName)', {
  firstName: 'John',
  lastName: 'Doe'
})
console.log('String concatenation:', stringConcat) // "John Doe"

// 3. Array operations
const arraySum = await evaluate('=SUM(:numbers)', {
  numbers: [1, 2, 3, 4, 5]
})
console.log('Array sum:', arraySum) // 15

// 4. Register custom JavaScript functions
console.log('\n--- Custom JavaScript Functions ---')

// Simple custom function
registerJsFunction('DOUBLE', (entry, [x], resolve) => {
  resolve(Number(x) * 2)
}, 1, 1)

// Custom function with multiple arguments
registerJsFunction('GREET', (entry, [name, title], resolve) => {
  const greeting = `Hello ${title || 'Mr.'} ${name}!`
  resolve(greeting)
}, 1, 2)

// Async custom function (simulating API call)
registerJsFunction('FETCH_USER', (entry, [userId], resolve) => {
  // Simulate async operation
  setTimeout(() => {
    const mockUser = { id: userId, name: `User ${userId}` }
    resolve(JSON.stringify(mockUser))
  }, 100)
}, 1, 1)

// 5. Using custom functions (requires evalFormulaWithCustom for async)
console.log('\n--- Using Custom Functions ---')

try {
  const doubled = await evaluate('=DOUBLE(:num)', { num: 21 })
  console.log('DOUBLE(21) =', doubled) // 42

  const greeting = await evaluate('=GREET(:name, :title)', {
    name: 'Alice',
    title: 'Dr.'
  })
  console.log('Greeting:', greeting) // "Hello Dr. Alice!"

  const userInfo = await evaluate('=FETCH_USER(:id)', { id: 123 })
  console.log('User info:', userInfo) // {"id":123,"name":"User 123"}

  // 6. Complex expressions with custom functions
  const complexResult = await evaluate(
    '=IF(DOUBLE(:x) > 10, GREET(:name), "Number too small")',
    { x: 6, name: 'Bob' }
  )
  console.log('Complex expression result:', complexResult)

  // 7. List all registered custom functions
  console.log('\n--- Registered Custom Functions ---')
  const customFunctions = listCustomFunctions()
  console.log('Available custom functions:', customFunctions)

} catch (error) {
  console.error('Error executing formulas:', error)
}

// 8. Error handling example
console.log('\n--- Error Handling ---')
try {
  const invalidResult = await evaluate('=INVALID_FUNCTION()')
} catch (error) {
  console.log('Caught expected error:', error.message)
}

// 9. More advanced examples
console.log('\n--- Advanced Examples ---')

// Date/time operations (if supported)
try {
  const dateResult = await evaluate('=NOW()')
  console.log('Current timestamp:', dateResult)
} catch (e) {
  console.log('Date functions may not be available')
}

// Conditional logic
const conditionalResult = await evaluate(
  '=IF(:age >= 18, "Adult", "Minor")',
  { age: 25 }
)
console.log('Age check:', conditionalResult) // "Adult"

// Array filtering/mapping (if supported)
const arrayOperation = await evaluate(
  '=:numbers.filter(:x > 3)',
  { numbers: [1, 2, 3, 4, 5, 6] }
)
console.log('Filtered array:', arrayOperation)

console.log('\n=== Example Complete ===')
}

// Run the examples
runExamples().catch(console.error)