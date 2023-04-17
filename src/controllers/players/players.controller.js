/* eslint-disable camelcase */
import { pool } from '../../db.js'
import { io } from '../../index.js'
import { v4 as uuidv4 } from 'uuid'
import { encryptPassword } from '../../utils/hashPasswords.js'
import { jwtCreate } from '../../utils/jsonWebToken.js'
import { emailJwt } from '../../configEnv.js'
import { usePromises } from '../../composables/usePromises.js'
import { useSocketInit } from '../../composables/useSocketInit.js'

// CANCELACIÓN DE ASISTENCIA A CS
export const cancelConfirmation = async ({ body }, res) => {
  const { id } = body

  const querys = [
    {
      cols: 'DELETE FROM confirmed_players WHERE id_signup_player = ? ',
      values: [id]
    },
    {
      cols: 'UPDATE signup_players SET attendance = ? WHERE id = ?',
      values: [false, id]
    }
  ]

  const { status, error, success } = await usePromises(
    querys,
    'Asistencia cancelada',
    'Error. Vuelva a intentar',
    () => {
      const { allPlayers, allconfirmPlayers } = useSocketInit(io)
      allconfirmPlayers()
      allPlayers()
    }
  )

  res.status(status).json({ status, resp: success ?? error })
}

// CONFIRMACIÓN DE ASISTENCIA A CS
export const assisConfirmation = async ({ body }, res) => {
  const { nick, ctr, id, name_server } = body
  const [rows] = await pool.query(
    'SELECT * FROM confirmed_players WHERE id_signup_player = ?',
    [id]
  )

  if (Object.keys(rows)?.length) {
    return res.status(400).json({
      status: 400,
      resp: { mssg: 'Ya confirmado!' }
    })
  }
  try {
    const [{ insertId }] = await pool.query(
      'INSERT INTO confirmed_players VALUES (?,?,?,?,?,?)',
      [null, true, nick, ctr, id, name_server]
    )
    await pool.query('UPDATE signup_players SET attendance = ? WHERE id = ?', [
      true,
      id
    ])

    const [[player]] = await pool.query(
      'SELECT * FROM confirmed_players WHERE id = ?',
      [insertId]
    )
    io.emit('assisConfirmation', player)
    const { allPlayers } = useSocketInit(io)

    allPlayers()

    res.status(200).json({
      status: 200,
      resp: { body: player, mssg: 'Confirmado' }
    })
  } catch (error) {
    res.status(400).json({
      status: 400,
      resp: { mssg: 'Error al confirmar' }
    })
  }
}

// REGISTRO DE JUGADORES
// !Válidar email únicos
export const signUpPlayer = async ({ body }, res) => {
  const { email, password, nick, name, ctr, phone, nameServer } = body

  const id = uuidv4()
  const inserts = [
    {
      cols: 'INSERT INTO sign_in (id,email,password, user_role, role_permissions, status, token) VALUES(?,?,?,?,?,?,?)',
      values: [
        id,
        email,
        encryptPassword(password),
        'USUARIO',
        '["USUARIO", "USUARIO"]',
        false,
        jwtCreate(email, emailJwt.jwt).token
      ]
    },

    {
      cols: 'INSERT INTO signup_players  (id, nick, name , ctr, phone, attendance, name_server, id_signin)  VALUES(?,?,?,?,?,?,?,?)',
      values: [id, nick, name, ctr, phone, false, nameServer, id]
    }
  ]

  const { status, error, success } = await usePromises(
    inserts,
    'Perfil Creado',
    'Error. Vuelva a intentar',
    () => {
      const { allPlayers } = useSocketInit(io)
      allPlayers()
    }
  )

  res.status(status).json({ status, resp: success ?? error })
}

// INFORMACIÓN POR JUGADOR (UNO)
export const player = async ({ body: { id } }, res) => {
  const querys = [
    {
      cols: `SELECT signup_players.*, squad.name_tactic, players.leader
      FROM players
      INNER JOIN signup_players ON players.id_signup_player = signup_players.id
      INNER JOIN squad ON squad.id = players.id_squad 
      WHERE id_squad = (SELECT id_squad FROM players WHERE id_signup_player = ?)`,
      values: [id]
    },
    {
      cols: `SELECT sp.id, sp.nick, sp.name, sp.ctr, sp.phone, sp.attendance, sp.name_server 
      FROM signup_players sp 
      INNER JOIN sign_in si on sp.id_signin = si.id 
      WHERE si.id = ?`,
      values: [id]
    }
  ]

  const { status, error, success } = await usePromises(
    querys,
    'Datos de usuario',
    'Error en datos de usuario'
  )

  res.status(status).json({ status, resp: success ?? error })
}
