import { queryBatchExe } from "../composables/queryBatchExe.js";
/**
 * Servicio para validar la confirmación de usuarios.
 * @param {Express.Response} res -Objeto para responder
 * @param {Array.<Object>} querys Matriz que contiene ua consulta:  { cols: string, values: [] }
 * @returns {object} - Express.Response | deny
 */
export const vlteConfirmation = async (res, [...querys]) => {
  try {
    const { success } = await queryBatchExe(querys);
    const errorIndex = Object.values(success.fullbody)
      .map(([[resp]]) => resp)
      .findIndex((i) => i !== undefined);
    if (errorIndex === -1) return { granted: true };

    const { [errorIndex]: deny } = {
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

    res.status(400).json(deny);
  } catch (error) {
    res.status(400).json({
      status: 400,
      error: {
        resp: { mssg: "Error al confirmar" },
      },
    });
  }
};

/**
 * Servicio para validar tiempo restante para cancelar confirmación a evento..
 * @param {Express.Response} res -Objeto para responder 
  @param { string} updateOn -Fecha de ultima actualización del registro(player)
 * @returns {object | Express.Response} - res o granted
 */

export const vlteCancelTime = (res, updateOn) => {
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
  return { granted: true };
};
