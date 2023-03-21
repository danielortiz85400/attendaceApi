import passport from 'passport'

export const authJwt = (req, res, next) => {
  passport.authenticate(['authJwt', 'jwtEmail'], (_err, user, info) => {
    if (!user) {
      return res.status(401).send({
        error: {
          status: 401,
          mssg: 'Sin autorización'
        }
      })
    }
    req.user = user
    next()
  })(req, res, next)
}
