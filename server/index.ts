import http from 'http'
import express from 'express'
import querystring from 'querystring'
import { promisifyGet, installDependencies } from './utils.js'
import { resolveDependencies } from './optimizer'
import path from 'path'
import fs from 'fs'

const app = express()
const hostname = '127.0.0.1'
const port = 3027

const server = http.createServer(async (req, res) => {
  console.log(`receive request[${req.method}]: ${req.url}`)

  const [reqPath, queryStr] = (req.url || '').split('?')
  const query = querystring.parse(queryStr || '')
  
  if (reqPath.startsWith('/packages/') && !queryStr) {
    const targetPath = path.join(__dirname, '../', reqPath)
    console.log('targetPath', targetPath)
    if (fs.existsSync(targetPath)) {
      const fileContent = fs.readFileSync(targetPath)
      res.statusCode = 200
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'application/x-javascript')
      res.write(fileContent)
      res.end()
      return
    }
    res.write('Can not get the file')
    res.end()
    return
  }

  // handle common npm package resource request
  if (query.packageName) {
    const targetDir = path.resolve(__dirname, 'downPackages')
    try {
      const targetPath = await installDependencies({ name: query.packageName, version: query.packageVersion }, targetDir)
      res.write(targetPath)
    } catch(err) {
      console.error(err)
      res.write(JSON.stringify(err))
    }
    res.end()
    return
  }

  // handle UMD resource request
  if (query.originUrl) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/x-javascript')
    const rawContent = await promisifyGet(query.originUrl)
    res.write(rawContent)
    res.end()
    return
  }

  // handle request to clear temp dir
  if (reqPath === '/clearTmpDir') {
    res.write('clear success')
    res.end()
    return
  }

  // default return
  res.setHeader('Content-Type', 'text/plain')
  res.write('request success')
  res.end()
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/packages/:pkgInfo/index.js', async (req, res) => {
  const pkgInfo = req.params['pkgInfo']
  const [pkgName, pkgVersion] = pkgInfo.split('@')
  // res.send(JSON.stringify({ pkgName, pkgVersion }))
  const targetInstallDir = path.resolve(__dirname, 'InstalledPackages')
  try {
    const targetPath = await installDependencies({ name: pkgName, version: pkgVersion }, targetInstallDir)
    res.end(targetPath)
  } catch(err) {
    console.error(err)
  }
})

app.get('/analysis/:tempName/index.js', async (req, res) => {
  const tempName = req.params['tempName']
  const tempPath = path.resolve(__dirname, `/InstalledPackages/${tempName}`)
  await resolveDependencies(tempPath)
  res.end('success')
})

app.listen(port, () => {
  const url = `http://${hostname}:${port}`
  console.log(`Server running at ${url}`)
})

// server.on('close', function () {
//   console.log('server close')
//   process.exit(1)
// })