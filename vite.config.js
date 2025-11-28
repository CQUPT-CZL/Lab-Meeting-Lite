import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    {
      name: 'members-save',
      configureServer(server) {
        server.middlewares.use('/api/save-members', (req, res, next) => {
          if (req.method !== 'POST') return next()
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}')
              const members = payload.members
              if (!Array.isArray(members)) {
                res.statusCode = 400
                res.end('invalid')
                return
              }
              const filePath = path.resolve(process.cwd(), 'src/config/members.json')
              fs.writeFileSync(filePath, JSON.stringify(members, null, 2))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.statusCode = 500
              res.end(String(err && err.message ? err.message : err))
            }
          })
        })
      },
    },
  ],
})