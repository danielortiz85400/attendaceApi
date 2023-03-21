import { cookieJwt } from '../../utils/jsonWebToken.js'
export const signUp = (req, res) => {
  res.json({ ...req.user, ...req.authInfo })
}

export const signIn = (req, res) => {
  if (req?.user?.success?.user.id !== undefined) {
    cookieJwt(req?.user?.success?.user.id, res)
  }
  res.send({ ...req.authInfo, ...req.user })
}
