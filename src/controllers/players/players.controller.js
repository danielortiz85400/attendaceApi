import { pool } from '../../db.js'
import { io } from '../../index.js'
import { v4 as uuidv4 } from 'uuid'
import { encryptPassword } from '../../utils/hashPasswords.js'
import { jwtCreate } from '../../utils/jsonWebToken.js'
import { emailJwt } from '../../configEnv.js'
import { usePromises } from '../../composables/usePromises.js'

// TODO:  PROBBADO Y FUNCIONANDO: HAY QUE APLICARLO
// TODO: AQUÍ SE EMITE UN EVENTO CUANDO SE CONFIRMA LA ASISTENCIA AL EVENTO
export const assisConfirmation = async (req, res) => {
  const result = await pool.query('insert into confirmed_players values (null, true, "»Nø†¤RiØus", "BM", "3886dfd531d824bcf353fe7fdef9162a", "MASTER");')

  console.log(`Usuario agregado a la base de datos con ID ${result[0].insertId}`)

  console.log(result)

  const rows = await pool.query('SELECT * FROM confirmed_players WHERE id = ?', [result[0].insertId])
  console.log(rows[0])
  io.emit('assisConfirmation', rows[0][0])
}

// REGISTRO DE JUGADORES
// !Válidar email únicos
export const signUpPlayer = async ({ body }, res) => {
  const { email, password, nick, name, ctr, phone, nameServer } = body

  const id = uuidv4()
  const inserts = [
    {
      cols:
          'INSERT INTO sign_in (id,email,password, user_role, role_permissions, status, token) VALUES(?,?,?,?,?,?,?)',
      values: [id, email, encryptPassword(password), 'USUARIO', '["USUARIO", "USUARIO"]', false, jwtCreate(email, emailJwt.jwt).token]
    },

    {
      cols:
            'INSERT INTO signup_players  (id, nick, name , ctr, phone, attendance, name_server)  VALUES(?,?,?,?,?,?,?)',
      values: [id, nick, name, ctr, phone, false, nameServer]
    }
  ]

  const { status, error, success } = await usePromises(inserts, 'Perfil creado', 'Error. Vuelva a intentar')

  res.status(status).json({ status, resp: success ?? error })
}
