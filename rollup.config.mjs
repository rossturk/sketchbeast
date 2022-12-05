import { terser } from "rollup-plugin-terser";

export default {
  input: 'src/beast.js',
  plugins: [terser()],
  output: {
    file: 'public/js/beast.js',
    name: 'Beast',
    format: 'umd'
  }
};

