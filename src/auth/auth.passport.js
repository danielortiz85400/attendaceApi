import { pool } from '../db.js'
import passport from 'passport'
import { encryptPassword, comparePassword } from '../utils/hashPasswords.js'
import { jwtCreate } from '../utils/jsonWebToken.js'
import { jwt, emailJwt } from '../configEnv.js'
import Jwt from 'jsonwebtoken'
import { Strategy as LocalStrategy } from 'passport-local-roles'
import {
  Strategy as JWTStrategy,
  ExtractJwt as ExtractJWT
} from 'passport-jwt'
import { sendEmail } from '../email/signUpConfirmation.js'
import { emitUserUpdate } from '../composables/useSocketRoutes.js'

// REGISTRO
passport.use(
  'signUp',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      roleField: 'userRole',
      passReqToCallback: true
    },
    async (_, email, password, userRole, done) => {
      try {
        const [rows] = await pool.query(
          'SELECT email FROM sign_in WHERE email = ?',
          [email]
        )
        if (rows?.length) {
          return done(null, {
            error: {
              status: 404,
              mssg: 'Verifique su email'
            }
          })
        }
        const { token } = jwtCreate(email, emailJwt.jwt)
        sendEmail(token, email)

        const [[{ name: role, permissions }]] = await pool.query(
          'SELECT * FROM roles WHERE name = ? ',
          [userRole]
        )

        await pool.query(
          'INSERT INTO sign_in (id,email,password, user_role, role_permissions,status, token) VALUES(?,?,?,?,?,?,?)',
          [
            null,
            email,
            encryptPassword(password),
            role,
            permissions,
            false,
            token
          ]
        )

        done(null, {
          success: {
            status: 200,
            mssg: 'Revise su email'
          }
        })
      } catch (error) {
        const { message, ...body } = error
        done(null, { errorConexion: { body, mssg: 'Sin conexión a bd' } })
        console.log(error)
      }
    }
  )
)

// INICIO DE SESIÓN
passport.use(
  'signIn',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, _, done) => {
      try {
        const [rows] = await pool.query(
          'SELECT id, email,password, user_role, role_permissions,status FROM sign_in WHERE email = ?',
          [email]
        )
        if (
          !Object.keys(rows)?.length ||
          !comparePassword(password, rows[0].password)
        ) {
          return done(null, { error: { status: 401, mssg: 'No autenticado' } })
        }

        const token = Jwt.sign({ id: rows[0].id }, jwt.jwtRefresh)
        const { resp } = await emitUserUpdate(token)

        done(null, resp)
      } catch (error) {
        console.log(error)
        const { message, ...body } = error
        done(null, { error: { body, mssg: 'Sin conexión' } })
      }
    }
  )
)

// AUTENTICACIÓN POR BEARER
passport.use(
  'authJwt',
  new JWTStrategy(
    {
      secretOrKey: jwt.token,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
    },
    (token, done) => {
      try {
        done(null, token)
      } catch (error) {
        done(error)
      }
    }
  )
)

// AUTENTICACIÓN POR PARAMS
passport.use(
  'jwtEmail',
  new JWTStrategy(
    {
      secretOrKey: emailJwt.jwt,
      jwtFromRequest: ExtractJWT.fromUrlQueryParameter('verify')
    },
    (token, done) => {
      try {
        done(null, token)
      } catch (error) {
        done(error)
      }
    }
  )
)
