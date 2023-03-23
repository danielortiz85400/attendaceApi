import { app } from './app.js'
import http from 'http'
import { Server } from 'socket.io'
import { server as svr } from './configEnv.js'
import './auth/auth.passport.js'
import { useSocket } from './socketInit.js'

export const server = http.createServer(app)

export const io = new Server(server, {
  cors: {
    origin: svr.origin
  }
})
useSocket(io)

const port = process.env.PORT || 4000
server.listen(port, () => {
  console.log(`Server listening on port ${port}` + '🚀')
})
