import { Router } from 'express'
import * as players from '../controllers/players/players.controller.js'

export const router = Router()

router.post('/allConfirmedPlayers', players.assisConfirmation)
router.post('/playerSignUp', players.signUpPlayer)
router.post('/player', players.player)
router.post('/confirmation', players.assisConfirmation)
router.post('/cancelConfirmation', players.cancelConfirmation)
