// TypeScript declarations for the wrapper with unified evaluate method
export declare function version(): string
export declare function evalFormula(formula: string): any
export declare function evalFormulaWith(formula: string, vars?: any | undefined | null): any
export declare function evalFormulaWithCustom(formula: string, vars?: any | undefined | null): Promise<any>
export declare function registerJsFunction(name: string, func: (...args: any[]) => any, minArgs?: number | undefined | null, maxArgs?: number | undefined | null): void
export declare function unregisterFunction(name: string): boolean
export declare function listCustomFunctions(): Array<string>
export declare function evaluate(formula: string, vars?: any | undefined | null): Promise<any>