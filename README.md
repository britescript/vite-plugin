# @britescript/vite

A Vite plugin for transforming Britescript (`.bs`) and Britescript JSX (`.bsx`) files.

## Features

- ✅ **Transform .bs files** - Compile Britescript to TypeScript
- ✅ **Transform .bsx files** - Compile Britescript + JSX to TypeScript + JSX
- ✅ **Source maps** - Full source map support for debugging
- ✅ **Hot Module Replacement** - Fast development with HMR
- ✅ **TypeScript integration** - Full TypeScript support
- ✅ **Configurable** - Extensive plugin options
- ✅ **Fast** - Optimized for Vite's dev server and build process

## Installation

```bash
npm install @britescript/vite
# or
yarn add @britescript/vite
# or
bun install @britescript/vite
```

## Basic Usage

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { britescript } from '@britescript/vite';

export default defineConfig({
  plugins: [
    britescript(), // Add before other plugins like React
    // ... other plugins
  ]
});
```

## Configuration

The plugin accepts various options to customize its behavior:

```typescript
import { defineConfig } from 'vite';
import { britescript } from '@britescript/vite';

export default defineConfig({
  plugins: [
    britescript({
      // File patterns to include (default: [/\.bs$/, /\.bsx$/])
      include: [/\.bs$/, /\.bsx$/],
      
      // File patterns to exclude (default: [/node_modules/])
      exclude: [/node_modules/],
      
      // Enable source maps (default: true)
      sourceMaps: true,
      
      // Target ECMAScript version (default: 'es2020')
      target: 'es2020',
      
      // Enable JSX transformation for .bsx files (default: true)
      jsx: true,
      
      // JSX factory function (default: 'React.createElement')
      jsxFactory: 'React.createElement',
      
      // JSX fragment factory (default: 'React.Fragment')
      jsxFragment: 'React.Fragment',
      
      // Enable verbose logging (default: false)
      verbose: true,
      
      // Custom compiler options
      compilerOptions: {
        // Add any custom Britescript compiler options
      }
    })
  ]
});
```

## Usage with React

For React projects, use the plugin alongside `@vitejs/plugin-react`. There are two recommended approaches:

### Option 1: Pure .bs files + .tsx files
Use .bs files for pure Britescript logic and .tsx files for React components:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { britescript } from '@britescript/vite';

export default defineConfig({
  plugins: [
    // Britescript plugin for .bs files only
    britescript({
      include: [/\.bs$/],
      jsx: false, // React plugin handles JSX
      verbose: true
    }),
    
    // React plugin for JSX transformation in .tsx files
    react({
      include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js']
    })
  ],
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.bs']
  }
});
```

### Option 2: Mixed .tsx files (Recommended)
Use .tsx files that can contain both Britescript syntax and JSX:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { britescript } from '@britescript/vite';

export default defineConfig({
  plugins: [
    // Britescript plugin for .bs and .tsx files with Britescript syntax
    britescript({
      include: [/\.bs$/, /\.tsx$/],
      jsx: false, // Let React plugin handle JSX
      verbose: true
    }),
    
    // React plugin for JSX transformation
    react({
      include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js']
    })
  ],
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.bs']
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

## File Examples

### Basic Britescript (.bs)

```britescript
// user.bs
struct User {
  id: number;
  name: string;
  email: string;
}

trait Displayable {
  display(): string;
}

impl Displayable for User {
  display() {
    return \`\${this.name} (\${this.email})\`;
  }
}

let users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" }
];

// Use pipe operations
users
  |> filter(user => user.id > 0)
  |> map(user => user.display())
  |> forEach(display => console.log(display));

export { User, users };
```

### React Component with Britescript (.tsx)

```typescript
// TodoList.tsx - Mixed Britescript syntax with JSX
import React, { useState } from 'react';

// Britescript structs and traits
struct TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

trait TodoActions {
  toggle(): void;
}

impl TodoActions for TodoItem {
  toggle() {
    this.completed = !this.completed;
  }
}

// React component with Britescript features
function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputText, setInputText] = useState("");
  
  // Use Britescript pipe operations
  let completedCount = todos
    |> filter(todo => todo.completed)
    |> length;

  let pendingTodos = todos
    |> filter(todo => !todo.completed);

  const addTodo = () => {
    if (inputText.trim()) {
      let newTodo: TodoItem = {
        id: Date.now(),
        text: inputText.trim(),
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInputText("");
    }
  };

  return (
    <div className="todo-app">
      <h1>Todos ({completedCount} completed)</h1>
      
      <div className="add-todo">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Add a todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      
      <div className="todos">
        {pendingTodos.map(todo => (
          <div key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => todo.toggle()}
            />
            <span>{todo.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TodoList;
```

## Transformations

The plugin transforms Britescript syntax to TypeScript:

| Britescript | TypeScript |
|-------------|------------|
| `struct User { name: string; }` | `type User = { name: string; };` |
| `trait Display { show(): string; }` | `interface Display { show(): string; }` |
| `impl Display for User { ... }` | `class UserDisplayImpl implements Display { ... }` |
| `let x = 5` | `const x = 5` |
| `data \|> func` | `func(data)` |

## Real-World Example

This plugin is used to build the official Britescript documentation site. Here's how it's configured:

```typescript
// vite.config.ts from the Britescript docs site
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { britescript } from '@britescript/vite'

export default defineConfig({
  plugins: [
    // Britescript plugin for .bs and .tsx files with Britescript syntax
    britescript({
      include: [/\.bs$/, /\.tsx$/],
      exclude: [/node_modules/],
      sourceMaps: true,
      target: 'es2020',
      jsx: false, // Let React plugin handle JSX
      verbose: true
    }),
    
    // React plugin for JSX transformation
    react({
      include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js']
    })
  ],
  
  resolve: {
    alias: {
      '@': '/src'
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.bs']
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
```

The documentation site uses .tsx files with embedded Britescript syntax for type-safe component props and state management, while maintaining full JSX compatibility.

## Development

```bash
# Install dependencies
bun install

# Build the plugin
bun run build

# Run in development mode
bun run dev

# Run tests
bun run test

# Lint and format
bun run check
```

## TypeScript Support

The plugin includes full TypeScript definitions. Import the types:

```typescript
import type { BritescriptPluginOptions } from '@britescript/vite';

const options: BritescriptPluginOptions = {
  verbose: true,
  target: 'es2020'
};
```

## Troubleshooting

### Plugin Order
Ensure the Britescript plugin comes **before** the React plugin in your config:

```typescript
export default defineConfig({
  plugins: [
    britescript(), // ✅ First
    react()        // ✅ Second
  ]
});
```

### JSX Issues
If you encounter JSX parsing errors:

1. Set `jsx: false` in Britescript plugin options
2. Let the React plugin handle all JSX transformation
3. Use `.tsx` extensions for React components

### Files Not Transforming
Enable verbose logging to debug:

```typescript
britescript({
  verbose: true, // See transformation logs
  include: [/\.bs$/, /\.tsx$/]
})
```

### Build Errors
If you get build errors, try:

1. Ensure both plugins use the same Vite version
2. Check that file extensions are properly configured in `resolve.extensions`
3. Verify that Britescript syntax is valid

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## Related

- [Britescript](https://github.com/britescript/britescript) - The core Britescript compiler
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) - Official React plugin for Vite