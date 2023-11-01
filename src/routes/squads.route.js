import { Router } from 'express'
import * as squad from '../controllers/squads/squads.controller.js'
export const router = Router()

router.post('/createSquads', squad.createSquads)
router.delete('/deleteSquads', squad.deleteSquads)
