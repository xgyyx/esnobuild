import { spawn, exec } from 'child_process'
import https from 'https'
import npa from "npm-package-arg"
import path, { join } from "path"
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * wrap https.get into promise
 * @param {string} url 
 * @returns promise
 */
export const promisifyGet = async (url = '') => {
  return new Promise(resolve => {
    let data = ''
    https.get(url, res => {
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve(data)
      })
    })
  })
}

/**
 * wrap spawn into promise
 * @param  {...any} command 
 * @returns null
 */
export const promisifySpawn = (...command) => {
  const p = spawn(command[0], command.slice(1))
  return new Promise((resolve) => {
    p.stdout.on('data', x => {
      process.stdout.write(x.toString())
    })
    p.stderr.on('data', x => {
      process.stderr.write(x.toString())
    })
    p.on('exit', result => {
      resolve(result)
    })
  })
}


/**
 * 安装依赖
 * @param {{ name: string; version?: string }} dependency 依赖信息（名称&版本）
 * @param {string} packagePath 包路径
 * @returns 
 */
export const installDependencies = (dependency, packagePath) => {
  return new Promise((resolve, reject) => {
    // 1. 拼接依赖字符串
    const depString = dependency.version
      ? `${dependency.name}@${dependency.version}`
      : dependency.name

    // 2. 通过npa查询依赖信息
    const spec = npa(depString)

    // const execCommand = `mkdir -p ${packagePath} && cd ${packagePath} && HOME=/tmp node ${join(
    //   __dirname,
    //   "../node_modules",
    //   "yarn",
    //   "lib",
    //   "cli",
    // )} add ${depString} ${
    //   spec.type === "git" ? "" : "--ignore-scripts"
    // } --no-lockfile --non-interactive --no-bin-links --ignore-engines --skip-integrity-check --cache-folder ./ --modules-folder ./`

    // 3. 拼接yarn的执行路径
    const yarnDir = join(__dirname, "../node_modules", "yarn", "lib", "cli")
    // 4. 构造临时的package.json内容
    const pkgJson = JSON.stringify({
      name: `${depString}_${Math.random()}`,
      dependencies: {
        [`${dependency.name}`]: `${dependency.version || 'latest'}`
      }
    })
    // 5. 生成临时安装路径
    const tmpPath = `${packagePath}/${dependency.name}_${Math.random()}`
    // 6. 构造yarn安装命令
    const execCommand = `mkdir -p ${tmpPath} && cd ${tmpPath} && touch package.json && echo '${pkgJson}' >> package.json && node ${yarnDir} add ${depString} ${
      spec.type === "git" ? "" : "--ignore-scripts"
    } --no-lockfile --non-interactive --no-bin-links --ignore-engines --skip-integrity-check`

    console.log('execCommand', execCommand)

    exec(
      execCommand,
      (err, stdout, stderr) => {
        if (err) {
          console.warn("got error from install: " + err);
          reject(
            err.message.indexOf("versions") >= 0
              ? new Error("INVALID_VERSION")
              : err,
          )
        } else {
          resolve(tmpPath)
        }
      },
    )
  })
}

/**
 * 构建ESM模块
 * @param {string} target 目标目录
 */
export const resolveDependencies = async (target) => {}
