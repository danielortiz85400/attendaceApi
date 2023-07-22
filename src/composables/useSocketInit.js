import { pool } from "../db.js";
import { cache } from "../index.js";
export const useSocketInit = (socket) => {
  //* TODOS LOS JUGADORES REGISTRADOS

  const allPlayers = () => {
    const cacheAllPlayers = cache.get("cacheAllPlayers");
    if (cacheAllPlayers)
      return socket.emit("allSignupPlayers", cacheAllPlayers);

    return pool.query("SELECT * FROM signup_players").then(([rows]) => {
      socket.emit("allSignupPlayers", rows);
      cache.set("cacheAllPlayers", rows, 120);
      return { players: rows };
    });
  };
  //* TODOS LOS JUGADORES CONFIRMADOS AL EVENTO
  const allconfirmPlayers = () => {
    const cacheAllConfirmPlayers = cache.get("cacheAllConfirmPlayers");

    if (cacheAllConfirmPlayers)
      return socket.emit("allconfirmPlayers", cacheAllConfirmPlayers);

    return pool.query("SELECT * FROM confirmed_players").then(([rows]) => {
      socket.emit("allconfirmPlayers", rows);
      cache.set("cacheAllConfirmPlayers", rows, 120);
      return { confirmPlayer: rows };
    });
  };
  //* TODOS LOS SQUADS CREADOS
  const allSquads = () => {
    const cacheAllSquads = cache.get("cacheAllSquads");
    if (cacheAllSquads) return socket.emit("allSquads", cacheAllSquads);
    return pool
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
        cache.set("cacheAllSquads", squads, 120);
        return { squads };
      });
  };
  //* TODOS LAS NOTIFICACIONES
  const allNotifications = () => {
    const cacheAllNotifications = cache.get("cacheAllNotifications");
    if (cacheAllNotifications)
      return socket.emit("allNotifications", cacheAllNotifications);
    pool
      .query(
        "SELECT * FROM attendance_notifications an INNER JOIN confirmed_players cp ON an.id_signup_player = cp.id_signup_player WHERE an.active = true"
      )
      .then(([rows]) => {
        socket.emit("allNotifications", rows);
        cache.set("cacheAllNotifications", rows, 120);
      });
  };
  return { allPlayers, allconfirmPlayers, allSquads, allNotifications };
};
