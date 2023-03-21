import { router as AuthRoutes } from './routes/Auth.route.js'
import { router as playerRoutes } from './routes/players.route.js'
import { router as squadRoutes } from './routes/squads.route.js'

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
export const app = express();

// CONFIG
[
  express.json(),
  cookieParser(),
  cors({
    origin: process.env.ORIGIN,
    credentials: true
  })

].map((r) => app.use(r));

// ROUTES
[
  { name: '/api', route: AuthRoutes },
  { name: '/api/players', route: playerRoutes },
  { name: '/api/squads', route: squadRoutes }

].map(({ name, route }) => app.use(name, route))
