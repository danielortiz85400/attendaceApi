import { genSaltSync, hashSync, compareSync } from 'bcrypt'

// Recibe una contraseña y retorna la misma encriptada.
export const encryptPassword = (password) => hashSync(password.toString(), genSaltSync(10))

export const comparePassword = (password, hash) => compareSync(password, hash)