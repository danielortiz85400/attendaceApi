import { pool } from "../db.js";
export const useSocketInit = (socket) => {
  //* TODOS LOS JUGADORES REGISTRADOS
  const allPlayers = () => {
    pool.query("SELECT * FROM signup_players").then(([rows]) => {
      socket.emit("allSignupPlayers", rows);
    });
  };
  //* TODOS LOS JUGADORES CONFIRMADOS AL EVENTO
  const allconfirmPlayers = () => {
    pool.query("SELECT * FROM confirmed_players").then(([rows]) => {
      socket.emit("allconfirmPlayers", rows);
    });
  };
  //* TODOS LOS SQUADS CREADOS
  const allSquads = () => {
    pool
      .query(
        `SELECT s.id as id_squad, s.name_tactic,
        p.id, p.leader,
        sp.id as id_signup_player , sp.nick, sp.name, sp.ctr, sp.attendance, sp.name_server
            FROM squad s
            INNER JOIN players p ON s.id = p.id_squad
            INNER JOIN  signup_players sp ON  sp.id = p.id_signup_player order by s.id`
      )
      .then((players) => {
        const squads = players[0]
          .reduce(
            (acc, curr, i) => (
              (acc[Math.floor(i / 5)] = [
                ...(acc[Math.floor(i / 5)] || []),
                curr,
                // eslint-disable-next-line no-sequences
              ]),
              acc
            ),
            []
          )
          .map((squads) => squads.sort((a, b) => b.leader - a.leader || 0));

        socket.emit("allSquads", squads);
      });
  };
  //* TODOS LAS NOTIFICACIONES
  const allNotifications = () => {
    pool
      .query(
        "SELECT * FROM attendance_notifications an INNER JOIN confirmed_players cp ON an.id_signup_player = cp.id_signup_player WHERE an.active = true"
      )
      .then(([rows]) => {
        socket.emit("allNotifications", rows);
      });
  };
  return { allPlayers, allconfirmPlayers, allSquads, allNotifications };
};
