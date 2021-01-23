import nodeResolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'

export default {
  input: 'docs/Generator.svelte',
  output: {
    file: 'docs/generator.js',
    format: 'iife',
    name: 'generator'
  },
  plugins: [
    nodeResolve(),
    svelte({
      emitCss: false
    })
  ]
}