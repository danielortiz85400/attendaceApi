import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router as AuthRoutes } from "./routes/Auth.route.js";
import { router as playerRoutes } from "./routes/players.route.js";
import { router as squadRoutes } from "./routes/squads.route.js";
import { router as serverRoutes } from "./routes/servers.route.js";

export const app = express();

  // CONFIG
const config = [  
  express.json(),
  cookieParser(),
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
]
config.map((libs) => app.use(libs));

// ROUTES
const routes = [
  { name: "/api", route: AuthRoutes },
  { name: "/api/players", route: playerRoutes },
  { name: "/api/squads", route: squadRoutes },
  { name: "/api/servers", route: serverRoutes },

]
routes.map(({ name, route }) => app.use(name, route));
