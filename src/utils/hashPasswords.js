import { genSaltSync, hashSync, compareSync } from 'bcrypt'

export const encryptPassword = (password) => hashSync(password.toString(), genSaltSync(10))

export const comparePassword = (password, hash) => compareSync(password, hash)