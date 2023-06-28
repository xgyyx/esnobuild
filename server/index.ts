import http from 'http'
import querystring from 'querystring'
import { promisifyGet, installDependencies } from './utils.js'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const hostname = '127.0.0.1'
const port = 3027

const server = http.createServer(async (req, res) => {
  console.log(`receive request: ${req.url}`)

  // reuqest query string should contain one of [originUrl, packageName]
  const [reqPath, queryStr] = (req.url || '').split('?')
  const query = querystring.parse(queryStr || '')
  
  // handle request to clear temp dir
  if (req.url === '/clearTmpDir') {
    res.write('clear success')
    res.end()
    return
  }

  if (req.url === '/queryPreBuildModule') {
    res.write('success')
    res.end()
    return
  }

  // simulate a reuqest that concurrent write something in a same file
  if (req.url === 'concurrentWrite') {
    res.write('success')
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

  // default return
  res.setHeader('Content-Type', 'text/plain')
  res.write('request success')
  res.end()
})

server.listen(port, hostname, () => {
  const url = `http://${hostname}:${port}`
  console.log(`Server running at ${url}`)
})

server.on('close', function () {
  console.log('server close')
  process.exit(1)
})