// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import polyfills from 'rollup-plugin-polyfill-node';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/chippr-agi.bundle.js',
    format: 'umd',
    name: 'ChipprAGI',
    sourcemap: true,
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    polyfills(),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env'],
    }),
  ],
  external: ['fs'],
};
