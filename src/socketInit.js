// import { pool } from './db.js'
import { socketAuth } from './middelwares/authSoketIO.js'
import { useSocketInit } from './composables/useSocketInit.js'
export const useSocket = (io) => {
  io.use(socketAuth)

  io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado')
    // carga de rutas con peticiones ALL

    Object.values(useSocketInit(socket)).forEach(fn => fn())

    socket.on('disconnect', () => {
      console.log('Socket disconnected: ', socket.id)
      socket.disconnect()
    })
  })
}
