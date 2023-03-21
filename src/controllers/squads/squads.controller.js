/* eslint-disable camelcase */
import { v4 as uuidv4 } from 'uuid'
import { usePromises } from '../../composables/usePromises.js'

// CRATE SQUADS
export const createSquads = async ({ body }, res) => {
  console.log(body)
  const { players, tactic, leader, server } = body
  const leaderId = players.find(
    ({ nick }) => nick === leader
  )?.id_signup_player

  const groupPlayers = players.map(({ id_signup_player }) => ({
    id: id_signup_player,
    leader: id_signup_player === leaderId
  }))

  const squad = uuidv4()
  const querys = [
    {
      cols: 'INSERT INTO squad (id, name_tactic) VALUES (?,?)',
      values: [squad, tactic]
    },
    {
      cols: 'INSERT INTO players (id, leader, id_signup_player, id_squad, name_server) VALUES ?',
      values: [
        groupPlayers.map(({ id, leader }) => [null, leader, id, squad, server])
      ]
    },
    {
      cols: 'DELETE FROM confirmed_players WHERE id_signup_player IN (?)',
      values: [groupPlayers.map(({ id }) => id)]
    }
  ]

  const { status, error, success } = await usePromises(
    querys,
    ' Grupo activo',
    'Error. Intente de nuevo.'
  )
  const keyName = status === 200 ? 'success' : 'error'

  res.status(status).json({ status, [keyName]: success ?? error })
}

// DELETE SQUADS
export const deleteSquads = async ({ body }, res) => {
  console.log(body)
  const squad = body

  const querys = [
    {
      cols: 'DELETE players, squad FROM players LEFT JOIN squad ON squad.id = players.id_squad WHERE players.id_squad = ?;',
      values: [squad[0]?.id_squad]
    },

    {
      cols: 'INSERT INTO confirmed_players (id, attendance, nick, ctr, id_signup_player, name_server) VALUES ?',

      values: [
        squad.map(
          ({ attendance, nick, ctr, id_signup_player, name_server }) => [
            null,
            attendance,
            nick,
            ctr,
            id_signup_player,
            name_server
          ]
        )
      ]
    }
  ]
  const { status, error, success } = await usePromises(
    querys,
    ' Grupo eliminado',
    'Error. Intente de nuevo.'
  )

  res.status(status).json({ status, resp: success ?? error })
}