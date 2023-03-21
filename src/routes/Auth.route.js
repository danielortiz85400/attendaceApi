import { Router } from 'express'
import passport from 'passport'
import { authJwt } from '../controllers/auth/authJwt.controller.js'
import { signUp, signIn } from '../controllers/auth/authPassport.controller.js'
import { signUpVerify } from '../controllers/auth/signUpVerify.controller.js'
import { inputsValidator } from '../validations/middelware.validations.js'
import { inputSignIn, inputSignUp } from '../validations/auth.validation.js'
import { refreshJwt } from '../utils/jwtRefresh.js'
export const router = Router()

router.get('/signUp/verify', authJwt, signUpVerify)
router.get('/jwtRefresh', refreshJwt)
router.get('/logout', (_, res) => {
  res.clearCookie('refreshToken')
  res.json('Refresh on')
})

router.post(
  '/signUp',
  [

    inputsValidator(inputSignUp),
    passport.authenticate('signUp', { session: false })
  ],
  signUp
)

router.post(
  '/signIn',
  [
    inputsValidator(inputSignIn),
    passport.authenticate('signIn', { session: false })
  ],
  signIn
)
