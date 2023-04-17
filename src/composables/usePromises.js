import { pool } from '../db.js'

export const usePromises = async ([...querys], sccsMssg, errMssg, fns) => {
  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const resp = await Promise.all(
      querys.map(({ cols, values }) => connection.query(cols, values)) // Debe usarse connection, no pool
    )
    await connection.commit()

    // eslint-disable-next-line no-unused-expressions
    fns ? fns() : false
    return {
      status: 200,
      success: {
        mssg: sccsMssg,
        fullbody: resp,
        body: { squad: [resp[0][0]], user: resp[1][0] }
      }
    }
  } catch (error) {
    console.log(error)
    await connection.rollback()
    return {
      status: 400,
      error: {
        mssg: errMssg
      }
    }
  }
}
