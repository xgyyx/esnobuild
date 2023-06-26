import typescript from '@rollup/plugin-typescript'

/**
 * @type { import('rollup').RollupOptions }
 */
const sharedNodeOptions = {
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  },
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: `node/[name].js`,
    chunkFileNames: 'node/chunks/dep-[hash].js',
    exports: 'named',
    format: 'cjs',
    externalLiveBindings: false,
    freeze: false
  },
  onwarn(warning, warn) {
    // node-resolve complains a lot about this but seems to still work?
    if (warning.message.includes('Package subpath')) {
      return
    }
    // we use the eval('require') trick to deal with optional deps
    if (warning.message.includes('Use of eval')) {
      return
    }
    if (warning.message.includes('Circular dependency')) {
      return
    }
    warn(warning)
  }
}

/**
 * @param {boolean} isProduction
 * @returns {import('rollup').RollupOptions}
 */
const createNodeConfig = (isProduction) => {
  const nodeConfig = {
    input: {
      index: path.resolve(__dirname, 'server/index.mjs')
    },
    output: {
      ...sharedNodeOptions.output,
      sourcemap: !isProduction
    },
    plugins: [
      typescript({
        tsconfig: ''
      })
    ]
  }
  return nodeConfig
}

export default (commandLineArgs) => {
  const isDev = commandLineArgs.watch
  const isProduction = !isDev

  return [
    createNodeConfig(isProduction)
  ]
}