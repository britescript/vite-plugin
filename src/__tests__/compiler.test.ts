// Tests for Britescript compiler functionality

import { describe, it, expect } from 'vitest';
import { compileBritescript, createBritescriptFilter } from '../compiler.js';
import type { BritescriptPluginOptions } from '../types.js';

describe('createBritescriptFilter', () => {
  it('should create a filter that includes .bs and .bsx files by default', () => {
    const options: BritescriptPluginOptions = {};
    const filter = createBritescriptFilter(options);
    
    expect(filter('test.bs')).toBe(true);
    expect(filter('test.bsx')).toBe(true);
    expect(filter('test.ts')).toBe(false);
    expect(filter('test.js')).toBe(false);
  });

  it('should respect custom include patterns', () => {
    const options: BritescriptPluginOptions = {
      include: [/\.britescript$/]
    };
    const filter = createBritescriptFilter(options);
    
    expect(filter('test.britescript')).toBe(true);
    expect(filter('test.bs')).toBe(false);
    expect(filter('test.bsx')).toBe(false);
  });

  it('should exclude node_modules by default', () => {
    const options: BritescriptPluginOptions = {};
    const filter = createBritescriptFilter(options);
    
    expect(filter('node_modules/test.bs')).toBe(false);
    expect(filter('src/test.bs')).toBe(true);
  });
});

describe('compileBritescript', () => {
  const defaultOptions: BritescriptPluginOptions = {
    sourceMaps: true,
    target: 'es2020',
    jsx: true,
    verbose: false
  };

  it('should transform struct declarations to type aliases', async () => {
    const code = `
struct User {
  name: string;
  age: number;
}
    `.trim();

    const result = await compileBritescript({
      id: 'test.bs',
      code,
      options: defaultOptions,
      isBuild: false,
      isSSR: false
    });

    expect(result.code).toContain('type User = {');
    expect(result.code).toContain('name: string;');
    expect(result.code).toContain('age: number;');
    expect(result.errors).toHaveLength(0);
  });

  it('should transform trait declarations to interfaces', async () => {
    const code = `
trait Displayable {
  display(): string;
}
    `.trim();

    const result = await compileBritescript({
      id: 'test.bs',
      code,
      options: defaultOptions,
      isBuild: false,
      isSSR: false
    });

    expect(result.code).toContain('interface Displayable {');
    expect(result.code).toContain('display(): string;');
    expect(result.errors).toHaveLength(0);
  });

  it('should transform let bindings to const', async () => {
    const code = `
let userName = "Alice";
let userAge = 25;
    `.trim();

    const result = await compileBritescript({
      id: 'test.bs',
      code,
      options: defaultOptions,
      isBuild: false,
      isSSR: false
    });

    expect(result.code).toContain('const userName = "Alice";');
    expect(result.code).toContain('const userAge = 25;');
    expect(result.errors).toHaveLength(0);
  });

  it('should handle generic structs', async () => {
    const code = `
struct Container<T> {
  value: T;
  count: number;
}
    `.trim();

    const result = await compileBritescript({
      id: 'test.bs',
      code,
      options: defaultOptions,
      isBuild: false,
      isSSR: false
    });

    expect(result.code).toContain('type Container<T> = {');
    expect(result.code).toContain('value: T;');
    expect(result.code).toContain('count: number;');
    expect(result.errors).toHaveLength(0);
  });

  it('should preserve JSX in .bsx files', async () => {
    const code = `
import React from 'react';

function MyComponent() {
  return <div>Hello World</div>;
}
    `.trim();

    const result = await compileBritescript({
      id: 'test.bsx',
      code,
      options: defaultOptions,
      isBuild: false,
      isSSR: false
    });

    expect(result.code).toContain('<div>Hello World</div>');
    expect(result.errors).toHaveLength(0);
  });

  it('should extract dependencies from imports', async () => {
    const code = `
import React from 'react';
import { useState } from 'react';
import './styles.css';
    `.trim();

    const result = await compileBritescript({
      id: 'test.bsx',
      code,
      options: defaultOptions,
      isBuild: false,
      isSSR: false
    });

    expect(result.dependencies).toContain('react');
    expect(result.dependencies).toContain('./styles.css');
    expect(result.errors).toHaveLength(0);
  });

  it('should generate source maps when enabled', async () => {
    const code = `
struct User {
  name: string;
}
    `.trim();

    const result = await compileBritescript({
      id: 'test.bs',
      code,
      options: { ...defaultOptions, sourceMaps: true },
      isBuild: false,
      isSSR: false
    });

    expect(result.map).toBeDefined();
    expect(result.map).toContain('"version":3');
    expect(result.errors).toHaveLength(0);
  });

  it('should not generate source maps when disabled', async () => {
    const code = `
struct User {
  name: string;
}
    `.trim();

    const result = await compileBritescript({
      id: 'test.bs',
      code,
      options: { ...defaultOptions, sourceMaps: false },
      isBuild: false,
      isSSR: false
    });

    expect(result.map).toBeUndefined();
    expect(result.errors).toHaveLength(0);
  });
});