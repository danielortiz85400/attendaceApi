import Joi from 'joi'
import { errorMessages } from './errorMessages.validations.js'

export const inputSignIn = Joi.object()
  .options({ abortEarly: false })
  .keys({
    email: Joi.string()
      .trim()
      .required()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
      .messages(errorMessages.signIn.email),
    password: Joi.string()
      .trim()
      .required()
      .messages(errorMessages.signIn.password)
  })

export const inputSignUp = Joi.object()
  .keys({
    email: Joi.string()
      .trim()
      .required()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
      .messages(errorMessages.signIn.email),

    password: Joi.string()
      .trim()
      .required()
      .pattern(
        /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])(?=.*[0-9])(?=.*[a-z])(?=.{9,})/
      )
      // string.pattern.base no funciona importado
      .messages({
        'string.pattern.base': 'Contraseña inválida',
        ...errorMessages.signIn.password
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .trim()
      .required()
      .messages(errorMessages.signUp.confirmPassword),

    userRole: Joi.string()
      .trim()
      .required()
      .valid('ADMINISTRADOR', 'MODERADOR', 'USUARIO')
      .messages(errorMessages.signUp.userRole)
  })
