// Britescript compiler integration for Vite plugin

import { createFilter } from '@rollup/pluginutils';
import type { BritescriptPluginOptions, CompileResult, TransformContext } from './types.js';

/**
 * Creates a filter function for determining which files to transform
 */
export function createBritescriptFilter(options: BritescriptPluginOptions) {
  const include = options.include || [/\.bs$/, /\.bsx$/];
  const exclude = options.exclude || [/node_modules/];
  
  return createFilter(include, exclude);
}

/**
 * Compiles Britescript code to TypeScript/JavaScript
 */
export async function compileBritescript(
  context: TransformContext
): Promise<CompileResult> {
  const { id, code, options } = context;
  
  try {
    const isBsxFile = id.endsWith('.bsx');
    const isBsFile = id.endsWith('.bs');
    
    if (options.verbose) {
      console.log(`[britescript] Compiling ${id}`);
    }
    
    // Check if the code actually contains Britescript syntax
    const hasBritescriptSyntax = containsBritescriptSyntax(code);
    
    let transformedCode = code;
    
    // Only transform if there's actual Britescript syntax
    if (hasBritescriptSyntax) {
      if (options.verbose) {
        console.log(`[britescript] Found Britescript syntax in ${id}, transforming...`);
      }
      transformedCode = transformBritescriptSyntax(code);
      if (options.verbose) {
        console.log(`[britescript] Transformation result preview: ${transformedCode.substring(0, 200)}...`);
      }
    }
    
    // For .bsx files, preserve JSX - the React plugin will handle it
    if (isBsxFile && options.jsx && hasBritescriptSyntax) {
      transformedCode = transformJSX(transformedCode, options);
    }
    
    // Generate source map if enabled and transformation occurred
    let sourceMap: string | undefined;
    if (options.sourceMaps && hasBritescriptSyntax) {
      sourceMap = generateSourceMap(id, code, transformedCode);
    }
    
    return {
      code: transformedCode,
      map: sourceMap,
      dependencies: extractDependencies(transformedCode),
      warnings: [],
      errors: []
    };
    
  } catch (error) {
    return {
      code: '',
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Checks if code contains Britescript-specific syntax
 */
function containsBritescriptSyntax(code: string): boolean {
  const britescriptPatterns = [
    /\bstruct\s+\w+/,
    /\btrait\s+\w+/,
    /\bimpl\s+\w+/,
    /\blet\s+\w+\s*=/,
    /\|>/
  ];
  
  return britescriptPatterns.some(pattern => pattern.test(code));
}

/**
 * Transforms Britescript-specific syntax to TypeScript
 */
function transformBritescriptSyntax(code: string): string {
  let transformed = code;
  
  // Transform struct declarations to type aliases
  transformed = transformed.replace(
    /struct\s+(\w+)(?:<([^>]+)>)?\s*\{([^}]+)\}/g,
    (match, name, generics, body) => {
      const genericPart = generics ? `<${generics}>` : '';
      const typeBody = body
        .split(';')
        .map((field: string) => field.trim())
        .filter((field: string) => field.length > 0)
        .map((field: string) => field.endsWith(';') ? field : field + ';')
        .join('\n  ');
      
      return `type ${name}${genericPart} = {\n  ${typeBody}\n};`;
    }
  );
  
  // Transform trait declarations to interfaces
  transformed = transformed.replace(
    /trait\s+(\w+)(?:<([^>]+)>)?\s*\{([^}]+)\}/g,
    (match, name, generics, body) => {
      const genericPart = generics ? `<${generics}>` : '';
      return `interface ${name}${genericPart} {\n${body}\n}`;
    }
  );
  
  // Transform impl blocks to classes (simplified)
  transformed = transformed.replace(
    /impl\s+(\w+)(?:<([^>]+)>)?\s+for\s+(\w+)\s*\{([^}]+)\}/g,
    (match, traitName, generics, structName, body) => {
      const className = `${structName}${traitName}Impl`;
      const genericPart = generics ? `<${generics}>` : '';
      return `class ${className}${genericPart} implements ${traitName}${genericPart} {\n  constructor(private data: ${structName}) {}\n${body}\n}`;
    }
  );
  
  // Transform let bindings to const
  transformed = transformed.replace(/\blet\s+/g, 'const ');
  
  // Transform pipe operations (basic implementation)
  transformed = transformPipeOperations(transformed);
  
  return transformed;
}

/**
 * Transforms pipe operations to method chains
 */
function transformPipeOperations(code: string): string {
  // This is a simplified transformation
  // A full implementation would need proper AST parsing
  
  // Handle simple pipe chains like: value |> func1 |> func2
  return code.replace(
    /(\w+(?:\([^)]*\))?)\s*\|>\s*(\w+)(?:\s*\|>\s*(\w+(?:\([^)]*\))?))?/g,
    (match, initial, func1, func2) => {
      if (func2) {
        // Multiple pipes
        if (func1.includes('(')) {
          return `${func2}(${func1.replace(/(\w+)\(([^)]*)\)/, '$1($2, ' + initial + ')')}`;
        } else {
          return `${func2}(${func1}(${initial}))`;
        }
      } else {
        // Single pipe
        if (func1.includes('(')) {
          return func1.replace(/(\w+)\(([^)]*)\)/, `$1(${initial}${func1.includes(',') ? ', ' : ''}$2)`);
        } else {
          return `${func1}(${initial})`;
        }
      }
    }
  );
}

/**
 * Transforms JSX for .bsx files
 */
function transformJSX(code: string, options: BritescriptPluginOptions): string {
  // For .bsx files, we need to preserve JSX syntax for Vite's React plugin to handle
  // Just return the code as-is - the React plugin will handle JSX transformation
  return code;
}

/**
 * Generates a basic source map
 */
function generateSourceMap(id: string, originalCode: string, transformedCode: string): string {
  // This is a placeholder - real source map generation would be more complex
  const map = {
    version: 3,
    file: id,
    sources: [id],
    sourcesContent: [originalCode],
    names: [],
    mappings: '' // This would contain the actual mappings
  };
  
  return JSON.stringify(map);
}

/**
 * Extracts import dependencies from code
 */
function extractDependencies(code: string): string[] {
  const dependencies: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    dependencies.push(match[1]);
  }
  
  return dependencies;
}