import { Plugin, PluginBuild, OnResolveArgs, build } from 'esbuild'
import path from 'path'

/**
 * build the package in esm
 * @param {string} targetPath building target path
 */
export const resolveDependencies = async (targetPath: string) => {
  const deps: Record<string, string> = {}
  await scanImports(targetPath, 'index.js', deps)
}

/**
 * scanImports
 * feature: use esbuild to scan, it's super fast, especially set write to false,
 * save more time of file I/O
 */
export const scanImports = async (workDir: string, entry: string, deps: Record<string, string>) => {
  const plugin = esbuildScanImportPlugin(deps)
  const absWorkingDir = path.join(__dirname, workDir)
  console.log('absWorkingDir', absWorkingDir)
  await build({
    absWorkingDir,
    entryPoints: [entry],
    write: false,
    bundle: true,
    format: 'esm',
    logLevel: 'error',
    plugins: [plugin]
  })
  console.log(deps)
}

/**
 * esbuildScanImportPlugin
 * feature: scan all imported package and get the real abs file path of the package
 */
export const esbuildScanImportPlugin = (deps: Record<string, string>): Plugin => {
  return {
    name: 'esbuildScanImportPlugin',
    setup(build: PluginBuild) {
      build.onResolve(
        {
          // avoid matching windows volume
          filter: /^[\w@][^:]/
        },
        async (args: OnResolveArgs) => {
          if (deps[args.path]) return
          deps[args.path] = args.resolveDir
          const result = await build.resolve(args.path, {
            kind: 'import-statement',
            resolveDir: './node_modules'
          })
          if (result.errors.length > 0) {
            return { errors: result.errors }
          }
          deps[args.path] = result.path
          return { path: result.path }
        }
      )
    }
  }
}

/**
 * 
 */
export const a = () => {}