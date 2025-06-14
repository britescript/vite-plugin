// Britescript Vite Plugin
// Handles .bs and .bsx file transformation

import type { Plugin, ResolvedConfig } from 'vite';
import { createBritescriptFilter, compileBritescript } from './compiler.js';
import type { BritescriptPluginOptions } from './types.js';

const PLUGIN_NAME = 'britescript';

/**
 * Default plugin options
 */
const defaultOptions: BritescriptPluginOptions = {
  include: [/\.bs$/, /\.bsx$/],
  exclude: [/node_modules/],
  sourceMaps: true,
  target: 'es2020',
  jsx: true,
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  development: process.env.NODE_ENV === 'development',
  verbose: false,
  compilerOptions: {}
};

/**
 * Creates the Britescript Vite plugin
 */
export function britescript(userOptions: BritescriptPluginOptions = {}): Plugin {
  const options = { ...defaultOptions, ...userOptions };
  const filter = createBritescriptFilter(options);
  
  let config: ResolvedConfig;
  let isBuild = false;
  
  return {
    name: PLUGIN_NAME,
    enforce: 'pre', // Run before other plugins
    
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      isBuild = resolvedConfig.command === 'build';
      
      // Override development option based on Vite config
      options.development = !isBuild && resolvedConfig.mode === 'development';
      
      if (options.verbose) {
        console.log(`[${PLUGIN_NAME}] Plugin initialized`, {
          mode: resolvedConfig.mode,
          isBuild,
          development: options.development
        });
      }
    },
    
    async resolveId(id, importer) {
      // Handle .bsx imports - make sure they resolve properly
      if (id.endsWith('.bsx') || id.endsWith('.bs')) {
        return null; // Let Vite handle the resolution
      }
      
      // Handle imports without extensions
      if (importer && !id.startsWith('.') && !id.startsWith('/') && !id.includes('node_modules')) {
        return null;
      }
      
      return null;
    },
    
    load(id) {
      // Let Vite handle all file loading
      return null;
    },
    
    async transform(code, id) {
      // Only transform .bs and .bsx files that pass the filter
      if (!filter(id)) {
        return null;
      }
      
      // Always process .bsx files to prevent other plugins from failing
      const isBsxFile = id.endsWith('.bsx');
      const isBsFile = id.endsWith('.bs');
      
      if (options.verbose) {
        console.log(`[${PLUGIN_NAME}] Transforming ${id}`);
      }
      
      try {
        const result = await compileBritescript({
          id,
          code,
          options,
          isBuild,
          isSSR: config.build?.ssr === true
        });
        
        if (result.errors && result.errors.length > 0) {
          for (const error of result.errors) {
            this.error(error);
          }
          return null;
        }
        
        if (result.warnings && result.warnings.length > 0) {
          for (const warning of result.warnings) {
            this.warn(warning);
          }
        }
        
        const isJSX = id.endsWith('.bsx');
        
        // For .bsx files, we need to tell Vite this is JSX code
        if (isJSX) {
          // Transform the id to make Vite treat it as JSX
          return {
            code: result.code,
            map: result.map ? JSON.parse(result.map) : null,
            meta: {
              vite: {
                lang: 'jsx'
              }
            }
          };
        }
        
        return {
          code: result.code,
          map: result.map ? JSON.parse(result.map) : null
        };
        
      } catch (error) {
        this.error(
          error instanceof Error ? error.message : String(error)
        );
        return null;
      }
    },
    
    generateBundle(outputOptions, bundle) {
      // Post-process generated bundle if needed
      if (options.verbose) {
        const britescriptFiles = Object.keys(bundle).filter(
          fileName => fileName.includes('.bs') || fileName.includes('.bsx')
        );
        
        if (britescriptFiles.length > 0) {
          console.log(`[${PLUGIN_NAME}] Generated bundle with ${britescriptFiles.length} Britescript files`);
        }
      }
    }
  };
}

// Export types for TypeScript users
export type { BritescriptPluginOptions, CompileResult, TransformContext } from './types.js';

// Default export for convenience
export default britescript;