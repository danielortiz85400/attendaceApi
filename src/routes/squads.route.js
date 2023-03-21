import { Router } from 'express'
import * as squad from '../controllers/squads/squads.controller.js'
import { pool } from '../db.js'
import { io } from '../index.js'
export const router = Router()

router.post('/createSquads', squad.createSquads)

router.post('/add-user', async (req, res) => {
  const { id, name } = req.body
  const newUser = { id, name }

  try {
    // Agregar el nuevo usuario a la base de datos
    const result = await pool.query('INSERT INTO users SET ?', newUser)
    console.log(`Usuario agregado a la base de datos con ID ${result[0].insertId}`)

    // Obtener el nuevo usuario de la base de datos y enviar una notificación a través de Socket.io
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result[0].insertId])
    io.emit('new_user', rows[0])

    res.send('Usuario agregado')
  } catch (err) {
    console.error(`Error al agregar el nuevo usuario: ${err.message}`)
    res.status(500).send('Error al agregar el nuevo usuario')
  }
})

router.delete('/deleteSquads', squad.deleteSquads)
