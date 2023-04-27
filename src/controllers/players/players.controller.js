/* eslint-disable camelcase */
import { pool } from '../../db.js'
import { io } from '../../index.js'
import { v4 as uuidv4 } from 'uuid'
import { encryptPassword } from '../../utils/hashPasswords.js'
import { jwtCreate } from '../../utils/jsonWebToken.js'
// import Jwt from 'jsonwebtoken'
import { emailJwt } from '../../configEnv.js'
import { usePromises } from '../../composables/usePromises.js'
import { useSocketInit } from '../../composables/useSocketInit.js'
import { emitUserUpdate } from '../../composables/useSocketRoutes.js'

// CANCELACIÓN DE ASISTENCIA A CS
export const cancelConfirmation = async (req, res) => {
  const jwtCookie = req.cookies?.refreshToken
  const { id: idUser } = req.body

  const querys = [
    {
      cols: 'DELETE FROM confirmed_players WHERE id_signup_player = ? ',
      values: [idUser]
    },
    {
      cols: 'UPDATE signup_players SET attendance = ? WHERE id = ?',
      values: [false, idUser]
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

  // ACTUALIZACION DE INFORMACIÓN AL CONFIRMAR
  // const { id } = Jwt.verify(jwtCookie, jwt.jwtRefresh)
  // const [rowSignin] = await pool.query(
  //   'SELECT id, email, user_role, role_permissions,status FROM sign_in WHERE id = ?',
  //   [id]
  // )
  // const queryUpdate = [
  //   {
  //     cols: `SELECT signup_players.*, squad.name_tactic, players.leader
  //     FROM players
  //     INNER JOIN signup_players ON players.id_signup_player = signup_players.id
  //     INNER JOIN squad ON squad.id = players.id_squad
  //     WHERE id_squad = (SELECT id_squad FROM players WHERE id_signup_player = ?)`,
  //     values: [rowSignin[0].id]
  //   },
  //   {
  //     cols: `SELECT sp.id, sp.nick, sp.name, sp.ctr, sp.phone, sp.attendance, sp.name_server
  //     FROM signup_players sp
  //     INNER JOIN sign_in si on sp.id_signin = si.id
  //     WHERE si.id = ?`,
  //     values: [rowSignin[0].id]
  //   }
  // ]
  // const { success: sccs } = await usePromises(queryUpdate)
  // res.status(status).json({ status, resp: success ?? error })

  // io.emit('userInit', {
  //   success: {
  //     user: rowSignin[0],
  //     player: sccs.body,
  //     jwt: jwtCreate(id, jwt.token)
  //   }
  // })
  res.status(status).json({ status, resp: success ?? error })

  await emitUserUpdate(jwtCookie, [
    {
      name: 'userInit',
      data: [] // userInit(emit de ruta) se pasa vacío ya que sus valores lo retorna usePromises()
    }
  ])
}

// CONFIRMACIÓN DE ASISTENCIA A CS
export const assisConfirmation = async (req, res) => {
  const { nick, ctr, id: idUser, name_server } = req.body

  try {
    const jwtCookie = req.cookies?.refreshToken
    const [rows] = await pool.query(
      'SELECT * FROM confirmed_players WHERE id_signup_player = ?',
      [idUser]
    )

    if (Object.keys(rows)?.length) {
      return res.status(400).json({
        status: 400,
        resp: { mssg: 'Ya confirmado!' }
      })
    }
    const [{ insertId }] = await pool.query(
      'INSERT INTO confirmed_players VALUES (?,?,?,?,?,?)',
      [null, true, nick, ctr, idUser, name_server]
    )
    await pool.query('UPDATE signup_players SET attendance = ? WHERE id = ?', [
      true,
      idUser
    ])

    const [[player]] = await pool.query(
      'SELECT * FROM confirmed_players WHERE id = ?',
      [insertId]
    )
    const { resp } = await emitUserUpdate(
      jwtCookie,
      [
        {
          name: 'assisConfirmation',
          data: player
        },
        {
          name: 'userInit',
          data: [] // userInit(emit de ruta) se pasa vacío ya que sus valores lo retorna usePromises()
        }
      ],
      () => {
        const { allPlayers } = useSocketInit(io)
        allPlayers()
      }
    )

    // ACTUALIZACION DE INFORMACIÓN AL CONFIRMAR
    // const { id } = Jwt.verify(jwtCookie, jwt.jwtRefresh)
    // const [rowSignin] = await pool.query(
    //   'SELECT id, email, user_role, role_permissions,status FROM sign_in WHERE id = ?',
    //   [id]
    // )
    // const querys = [
    //   {
    //     cols: `SELECT signup_players.*, squad.name_tactic, players.leader
    //     FROM players
    //     INNER JOIN signup_players ON players.id_signup_player = signup_players.id
    //     INNER JOIN squad ON squad.id = players.id_squad
    //     WHERE id_squad = (SELECT id_squad FROM players WHERE id_signup_player = ?)`,
    //     values: [rowSignin[0].id]
    //   },
    //   {
    //     cols: `SELECT sp.id, sp.nick, sp.name, sp.ctr, sp.phone, sp.attendance, sp.name_server
    //     FROM signup_players sp
    //     INNER JOIN sign_in si on sp.id_signin = si.id
    //     WHERE si.id = ?`,
    //     values: [rowSignin[0].id]
    //   }
    // ]

    // const { success } = await usePromises(
    //   querys
    // )
    // io.emit('assisConfirmation', player)
    // io.emit('userInit', {
    //   success: {
    //     user: rowSignin[0],
    //     player: success.body,
    //     jwt: jwtCreate(id, jwt.token)
    //   }
    // })

    res.status(200).json({
      status: 200,
      resp: { body: player, mssg: 'Confirmado' },
      usuario: resp
    })

    // res.status(200).json({
    //   status: 200,
    //   resp: { body: player, mssg: 'Confirmado' },
    //   usuario: {
    //     success: {
    //       user: rowSignin[0],
    //       player: success.body,
    //       jwt: jwtCreate(id, jwt.token)
    //     }
    //   }
    // })
  } catch (error) {
    console.log(error)

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
