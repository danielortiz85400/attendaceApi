import { pool } from './db.js'
import { socketAuth } from './middelwares/authSoketIO.js'

export const useSocket = (io) => {
  io.use(socketAuth)

  io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado')
    // carga de rutas con peticiones ALL

    //* TODOS LOS JUGADORES CONFIRMADOS AL EVENTO
    pool.query('SELECT * FROM confirmed_players').then(([rows]) => {
      socket.emit('allconfirmPlayers', rows)
    })

    //* TODOS LOS SQUADS CREADOS
    pool
      .query(
            `
        select s.id as id_squad, s.name_tactic, 
        p.id, p.leader, 
        sp.id as id_signup_player , sp.nick, sp.name, sp.ctr, sp.attendance, sp.name_server
            from squad s 
            inner join players p on s.id = p.id_squad
            inner join  signup_players sp on  sp.id = p.id_signup_player order by s.id`
      )
      .then((players) => {
        const squads = players[0]
          .reduce(
            (acc, curr, i) => (
              (acc[Math.floor(i / 5)] = [
                ...(acc[Math.floor(i / 5)] || []),
                curr
                // eslint-disable-next-line no-sequences
              ]),
              acc
            ),
            []
          )
          .map((squads) => squads.sort((a, b) => b.leader - a.leader || 0))

        socket.emit('allSquads', squads)
      })

    socket.on('disconnect', () => {
      console.log('Socket disconnected: ', socket.id)
      socket.disconnect()
    })
  })
}
