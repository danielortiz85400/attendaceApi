import { Router } from 'express'
import * as servers from '../controllers/servers/servers.controller.js'
export const router = Router()

router.post('/createServer', servers.createServer)
router.delete('/removeServer', servers.removeServer)