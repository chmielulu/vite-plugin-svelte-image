import { defineConfig } from "rollup";
import svelte from "rollup-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig({
  input: "src/index.ts",
  output: {
    sourcemap: false,
    format: "esm",
    dir: "dist",
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess({ sourceMap: false }),
      compilerOptions: {
        dev: false,
      },
    }),
    commonjs(),
    css({ output: "bundle.css" }),
    typescript(),
    terser({ mangle: true, ecma: 2018 }),
  ],
});
