import { pool } from '../db.js'

export const usePromises = async ([...querys], sccsMssg, errMssg) => {
  console.log(querys)

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    await Promise.all(
      querys.map(({ cols, values }) => connection.query(cols, values)) // Debe usarse connection, no pool
    )
    await connection.commit()
    console.log('insert exitosos (signup players)')
    return {
      status: 200,
      success: {
        mssg: sccsMssg
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
