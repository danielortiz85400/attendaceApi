
import { createPool } from 'mysql2/promise'
import { conectOptions } from './configEnv.js'

export const pool = createPool(conectOptions)
