import { describe, it, expect } from 'vitest'
import { evalFormula, evalFormulaWith, evalFormulaWithCustom, registerJsFunction, unregisterFunction, evaluate } from '..'

describe('skillet-node basic', () => {
  it('evaluates simple expression', () => {
    const r = evalFormula('= 2 + 3 * 4')
    expect(r).toBe(14)
  })

  it('evaluates with variables', () => {
    const r = evalFormulaWith('=SUM(:a, :b)', { a: 10, b: 5 })
    expect(r).toBe(15)
  })

  it('supports JS custom functions (async)', async () => {
    registerJsFunction('ADD5', function(args, argsArray, resolve) {
      // The function receives: null, [37], resolve_function
      // The actual arguments are in the second parameter (argsArray)
      const firstArg = Array.isArray(argsArray) ? argsArray[0] : 0
      resolve(Number(firstArg) + 5)
    }, 1, 1)
    const r = await evalFormulaWithCustom('=ADD5(:n)', { n: 37 })
    expect(r).toBe(42)
  })
})

describe('unified evaluate method', () => {
  it('evaluates simple expressions without variables or custom functions', async () => {
    const r = await evaluate('= 2 + 3 * 4')
    expect(r).toBe(14)
  })

  it('evaluates expressions with variables but no custom functions', async () => {
    const r = await evaluate('=SUM(:a, :b)', { a: 10, b: 5 })
    expect(r).toBe(15)
  })

  it('evaluates expressions with custom functions', async () => {
    // Clean up any existing functions first
    unregisterFunction('MULTIPLY3')
    
    registerJsFunction('MULTIPLY3', function(args, argsArray, resolve) {
      const firstArg = Array.isArray(argsArray) ? argsArray[0] : 0
      resolve(Number(firstArg) * 3)
    }, 1, 1)
    
    const r = await evaluate('=MULTIPLY3(:x)', { x: 7 })
    expect(r).toBe(21)
    
    // Clean up
    unregisterFunction('MULTIPLY3')
  })

  it('evaluates expressions with custom functions but no variables', async () => {
    // Clean up any existing functions first  
    unregisterFunction('GET_ANSWER')
    
    registerJsFunction('GET_ANSWER', function(args, argsArray, resolve) {
      resolve(42)
    }, 0, 0)
    
    const r = await evaluate('=GET_ANSWER()')
    expect(r).toBe(42)
    
    // Clean up
    unregisterFunction('GET_ANSWER')
  })

  it('handles undefined and null variables correctly', async () => {
    const r1 = await evaluate('= 2 + 3', undefined)
    const r2 = await evaluate('= 2 + 3', null)
    expect(r1).toBe(5)
    expect(r2).toBe(5)
  })
})

