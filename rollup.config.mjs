import { terser } from "rollup-plugin-terser";
import { mkdirSync } from "fs";

// Ensure output directory exists
mkdirSync('public/js', { recursive: true });

export default [
  // Main bundle
  {
    input: 'src/beast.js',
    plugins: [terser()],
    output: {
      file: 'public/js/beast.js',
      name: 'Beast',
      format: 'umd',
      sourcemap: true
    }
  },
  // Worker bundle
  {
    input: 'src/worker.js',
    plugins: [terser()],
    output: {
      file: 'public/js/worker.js',
      format: 'iife',
      sourcemap: true
    }
  }
];

