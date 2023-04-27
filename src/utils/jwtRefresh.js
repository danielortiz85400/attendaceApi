import Jwt from 'jsonwebtoken'
import { jwt } from '../configEnv.js'
import { jwtCreate } from './jsonWebToken.js'
import { pool } from '../db.js'
import { usePromises } from '../composables/usePromises.js'

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
    const querys = [
      {
        cols: `SELECT signup_players.*, squad.name_tactic, players.leader
        FROM players
        INNER JOIN signup_players ON players.id_signup_player = signup_players.id
        INNER JOIN squad ON squad.id = players.id_squad 
        WHERE id_squad = (SELECT id_squad FROM players WHERE id_signup_player = ?)`,
        values: [rows[0].id]
      },
      {
        cols: `SELECT sp.id, sp.nick, sp.name, sp.ctr, sp.phone, sp.attendance, sp.name_server 
        FROM signup_players sp 
        INNER JOIN sign_in si on sp.id_signin = si.id 
        WHERE si.id = ?`,
        values: [rows[0].id]
      }
    ]

    const { success } = await usePromises(
      querys
    )

    res.status(200).json({
      success: {
        user: rows[0],
        player: success.body,
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
