import html from '@rollup/plugin-html'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
	input: 'example/src/index.js',
	output: {
		file: 'example/dist/bundle.js',
		format: 'es',
	},
	plugins: [
    commonjs(),
    nodeResolve(),
    html({
      title: 'virtual-dom-demo',
      fileName: 'index.html',
    }),
	]
}