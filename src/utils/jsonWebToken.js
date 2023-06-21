import Jwt from 'jsonwebtoken'
import { jwt } from '../configEnv.js'

export const jwtCreate = (id, key) => {
  const expiresIn = 1000 * 43200
  return { token: Jwt.sign({ id }, key, { expiresIn }), expiresIn }
}

export const cookieJwt = (id, res) => {
  const expireIn = 1000 * 43200
  const refresToken = Jwt.sign({ id }, jwt.jwtRefresh)

  res.cookie('refreshToken', refresToken, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    expires: new Date(Date.now() + expireIn)
  })
}