import { emitUpdateUser } from '../composables/useSocketRoutes.js'

export const refreshJwt = async (req, res) => {
  try {
    const jwtCookie = req.cookies?.refreshToken
    if (!jwtCookie) {
      return res.status(401).json({
        error: {
          status: 401,
          mssg: 'Autenticación inválida'
        }
      })
    }

    const { resp } = await emitUpdateUser(jwtCookie)
    res.status(200).json(resp)
  } catch (error) {
    res.status(400).json({
      error: {
        mssg: 'Acceso inválido'
      }
    })
  }
}
