import Jwt from 'jsonwebtoken'
import { jwt } from '../configEnv.js'
import { jwtCreate } from './jsonWebToken.js'
import { pool } from '../db.js'

export const refreshJwt = async (req, res) => {
  try {
    const jwtCookie = req.cookies?.refreshToken
    if (!jwtCookie) {
      return res.status(401).json({
        error: {
          status: 401,
          mssg: 'Autenticación inválida'
        }
      })
    }

    const { id } = Jwt.verify(jwtCookie, jwt.jwtRefresh)
    const [rows] = await pool.query(
      'SELECT id, email, user_role, role_permissions,status FROM sign_in WHERE id = ?',
      [id]
    )
    res.status(200).json({
      success: {
        user: rows[0],
        jwt: jwtCreate(id, jwt.token)
      }
    })
  } catch (error) {
    res.status(400).json({
      error: {
        mssg: 'Token inválido'
      }
    })
  }
}
