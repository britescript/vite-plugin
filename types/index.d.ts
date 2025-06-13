// Type definitions for @britescript/vite

declare module '@britescript/vite' {
  import type { Plugin } from 'vite';

  export interface BritescriptPluginOptions {
    /**
     * Include patterns for files to transform
     * @default [/\.bs$/, /\.bsx$/]
     */
    include?: Array<string | RegExp>;
    
    /**
     * Exclude patterns for files to skip
     * @default [/node_modules/]
     */
    exclude?: Array<string | RegExp>;
    
    /**
     * Enable source maps
     * @default true
     */
    sourceMaps?: boolean;
    
    /**
     * Target ECMAScript version
     * @default 'es2020'
     */
    target?: 'es5' | 'es2015' | 'es2020' | 'esnext';
    
    /**
     * Enable JSX transformation for .bsx files
     * @default true
     */
    jsx?: boolean;
    
    /**
     * JSX factory function
     * @default 'React.createElement'
     */
    jsxFactory?: string;
    
    /**
     * JSX fragment factory
     * @default 'React.Fragment'
     */
    jsxFragment?: string;
    
    /**
     * Enable development mode features
     * @default process.env.NODE_ENV === 'development'
     */
    development?: boolean;
    
    /**
     * Custom compiler options to pass to Britescript
     */
    compilerOptions?: Record<string, any>;
    
    /**
     * Enable verbose logging
     * @default false
     */
    verbose?: boolean;
  }

  export interface CompileResult {
    code: string;
    map?: string;
    dependencies?: string[];
    warnings?: string[];
    errors?: string[];
  }

  export interface TransformContext {
    id: string;
    code: string;
    options: BritescriptPluginOptions;
    isBuild: boolean;
    isSSR: boolean;
  }

  /**
   * Creates the Britescript Vite plugin
   */
  export function britescript(options?: BritescriptPluginOptions): Plugin;

  /**
   * Default export (same as named export)
   */
  export default function britescript(options?: BritescriptPluginOptions): Plugin;
}

declare module '*.bs' {
  const content: any;
  export default content;
}

declare module '*.bsx' {
  const content: any;
  export default content;
}