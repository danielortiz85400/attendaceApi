import { queryBatchExe } from "./queryBatchExe.js";
import Jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { jwt } from "../configEnv.js";
import { io } from "../index.js";
import { jwtCreate } from "../utils/jsonWebToken.js";

// ACTUALIZACION DE INFORMACIÓN AL CONFIRMAR
export const emitUpdateUser = async (jwtCookie, emitsRoutes = [], emitsAll) => {
  const { id } = Jwt.verify(jwtCookie, jwt.jwtRefresh);
  const [row] = await pool.query(
    "SELECT id, email, user_role, role_permissions,status FROM sign_in WHERE id = ?",
    [id]
  );

  const queryUpdate = [
    {
      cols: `SELECT signup_players.*, squad.name_tactic, players.leader, players.id_squad
    FROM players
    INNER JOIN signup_players ON players.id_signup_player = signup_players.id
    INNER JOIN squad ON squad.id = players.id_squad 
    WHERE id_squad = (SELECT id_squad FROM players WHERE id_signup_player = ?)`,
      values: [row[0].id],
    },
    {
      cols: `SELECT sp.id, sp.nick, sp.name, sp.ctr, sp.phone, sp.attendance, sp.name_server, sp.create_at, sp.update_on
    FROM signup_players sp 
    INNER JOIN sign_in si on sp.id_signin = si.id 
    WHERE si.id = ?`,
      values: [row[0].id],
    },
  ];
  const { success } = await queryBatchExe(queryUpdate);

  const resp = {
    success: {
      user: row[0],
      player: success.body,
      jwt: jwtCreate(id, jwt.token),
    },
  };

  if (Object.entries(emitsRoutes)?.length) {
    const cols = emitsRoutes.map((col) => {
      if (!Object.entries(col.data)?.length) {
        col.data = resp;
      }
      return col;
    });

    cols.forEach((col) => {
      io.emit(col.name, col.data);
    });
  }

  // eslint-disable-next-line no-unused-expressions
  emitsAll ? emitsAll() : false;
  return { success, resp };
};
