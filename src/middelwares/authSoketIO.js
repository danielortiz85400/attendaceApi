import Jwt from 'jsonwebtoken'
import { jwt } from '../configEnv.js'

export function socketAuth (socket, next) {
  const token = socket.handshake.auth.token

  Jwt.verify(token, jwt.token, { ignoreExpiration: false }, (err, decoded) => {
    if (err) {
      socket.disconnect()
      return next(new Error('Token inválido'))
    }
    socket.decoded = decoded
    next()
  })
}
