export const inputsValidator = (schema) => {
  return (req, res, next) => {
    const {
      error
    } = schema.validate(req.body)
    return (error?.message
      ? res.status(400).send({
        validationError: { mssg: error?.details.map(({ message }) => message) }
      })
      : next())
  }
}
