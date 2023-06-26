import fs from 'fs'
import path from 'path'

export class ConcurrentFileWriter {
  constructor() {}

  async writeFiles(files) {
    try {
      const writersPromises = files.map(async (file) => {
        if (!await this.checkIfWritingIsPossible(file)) return
        await new Promise((resolve, reject) => {
          const stream = fs.createWriteStream(file)
          stream.on("error", (err) => {
            console.log(`Error while writting ${file}:${err}`)
          })
          const content = "Some data"
          stream.write(content)
          stream.end()
          resolve()
        })
        .then(()=>{
          console.log(`writing all done`);
          process.exit();
        })
      })

      await Promise.all(writersPromises)
    } catch(err) {
      console.log(`Error during processing:`, err)
    }
  }

  checkIfWritingIsPossible(file) {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found at ${file}`)
    } else if (this.canWriteTo(file)) {
      throw new Error(`Cannot write to file ${file}`)
    } else {
      return true
    }
  }

  canWriteTo(file) {
    return fs.accessSync(file, fs.F_WRITE)
  };
}


export default ConcurrentFileWriter