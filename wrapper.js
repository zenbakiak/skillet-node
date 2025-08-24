// Wrapper that adds the unified evaluate method to the auto-generated bindings
const nativeBindings = require('./index.js')

// Unified evaluate method that automatically chooses the right evaluation approach
async function evaluate(formula, vars) {
  const customFunctions = nativeBindings.listCustomFunctions()
  
  if (customFunctions.length > 0) {
    // Custom functions are registered, use async evaluation
    return await nativeBindings.evalFormulaWithCustom(formula, vars)
  } else if (vars !== undefined && vars !== null) {
    // Variables provided but no custom functions, use sync with variables
    return nativeBindings.evalFormulaWith(formula, vars)
  } else {
    // Simple evaluation without variables or custom functions
    return nativeBindings.evalFormula(formula)
  }
}

// Export everything from the native bindings plus our unified evaluate function
module.exports = {
  ...nativeBindings,
  evaluate
}