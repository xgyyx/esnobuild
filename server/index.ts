import http from 'http'
import querystring from 'querystring'
import { promisifyGet, installDependencies } from './utils.js'
import path from 'path'
import fs from 'fs'


const hostname = '127.0.0.1'
const port = 3027

const server = http.createServer(async (req, res) => {
  console.log(`receive request[${req.method}]: ${req.url}`)

  const [reqPath, queryStr] = (req.url || '').split('?')
  const query = querystring.parse(queryStr || '')
  
  if (reqPath.startsWith('/tmp/') && !queryStr) {
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

server.listen(port, hostname, () => {
  const url = `http://${hostname}:${port}`
  console.log(`Server running at ${url}`)
})

server.on('close', function () {
  console.log('server close')
  process.exit(1)
})