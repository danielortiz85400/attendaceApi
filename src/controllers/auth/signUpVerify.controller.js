import { pool } from '../../db.js'
export const signUpVerify = async (req, res) => {
  const { verify, email } = req.query

  try {
    const activateAcc = await pool.query("UPDATE sign_in SET token = '', status = ? WHERE EXISTS (SELECT id FROM sign_in WHERE email = ? AND token = ?)", [true, email, verify])

    const template = activateAcc[0].changedRows > 0 ? 'signUpSuccess.html' : 'signUpError.html'
    res.sendFile(`${template}`, { root: 'src/views' })
  } catch (error) {
    res.status(401).send('Sin autorización')
  }
}
