import { pool } from "../db.js";

/**
 * Servicio para validar la confirmación de usuarios.
 * @param {Array.<Object>} querys matriz que contiene ua consulta: cols<string>:query, values<[]>:valores
 * @returns {object} - errorType
 */
export const vlteConfirmation = async ([...querys]) => {
  try {
    const Query = await Promise.all(
      querys.map(({ cols, values }) => pool.query(cols, values))
    );
    const errorIndex = Object.values(Query)
      .map(([[resp]]) => resp)
      .findIndex((i) => i !== undefined);
    if (errorIndex === -1) return { errorType: -1 };

    const { [errorIndex]: errorType } = {
      [0]: {
        // isConfirmed
        status: 400,
        resp: {
          mssg: "Ya ha confirmado!",
        },
      },
      [1]: {
        // isInSquad
        status: 400,
        resp: {
          mssg: "Está en grupo!",
        },
      },
    };

    return { errorType };
  } catch (error) {
    console.log(error);
  }
};

export const vlteCancel = (res, updateOn) => {
  const currDate = new Date().getTime();
  const dateToCompare = new Date(updateOn).getTime();
  const missingMs = 24 * 60 * 60 * 1000 - (currDate - dateToCompare);

  if (missingMs > 0) {
    const missingHours = Math.floor(missingMs / (1000 * 60 * 60));
    const missingMinutes = Math.floor(
      (missingMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    return res.status(422).json({
      status: 422,
      resp: {
        mssg: `Tiempo: ${missingHours} h y ${missingMinutes} min para cancelar.`,
      },
    });
  }
};
