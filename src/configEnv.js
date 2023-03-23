import { config } from 'dotenv'
config()

export const conectOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT

}

export const jwt = {
  token: process.env.TOKEN,
  jwtRefresh: process.env.JWT_REFRESH,
  mode: process.env.MODE
}

export const emailJwt = {
  jwt: process.env.JWTEMAIL
}

export const nodeMailer = {
  email: 'admasistencia.app@gmail.com',
  password: 'vplujgyqvajfppxy'
}

export const server = {
  origin: process.env.ORIGIN
}
