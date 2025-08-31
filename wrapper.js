// Wrapper that adds the unified evaluate method with Next.js/bundler compatibility
let nativeBindings

// First try the normal path
try {
  nativeBindings = require('./index.js')
} catch (error) {
  // Fallback for bundler issues with missing optional dependencies
  if (error.message.includes('Cannot find module \'@zenbakiak/skillet-node-')) {
    // Remove optional dependencies from the generated index.js and require it again
    const Module = require('module')
    const originalRequire = Module.prototype.require
    
    // Temporarily patch require to ignore missing optional deps
    Module.prototype.require = function(id) {
      if (id && id.startsWith('@zenbakiak/skillet-node-') && id.includes('-')) {
        // This is an optional platform-specific package that doesn't exist
        // Throw a more specific error that the original code can handle
        const err = new Error(`MODULE_NOT_FOUND: ${id}`)
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      return originalRequire.apply(this, arguments)
    }
    
    try {
      // Force re-evaluation of index.js with patched require
      delete require.cache[require.resolve('./index.js')]
      nativeBindings = require('./index.js')
    } finally {
      // Always restore original require
      Module.prototype.require = originalRequire
    }
  } else {
    throw error
  }
}

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

// Export only the unified evaluate function and necessary helper functions
module.exports = {
  evaluate,
  registerJsFunction: nativeBindings.registerJsFunction,
  unregisterFunction: nativeBindings.unregisterFunction,
  listCustomFunctions: nativeBindings.listCustomFunctions,
  version: nativeBindings.version
}