/* eslint-disable camelcase */
import { pool } from "../../db.js" 
import { io } from "../../index.js";
import { v4 as uuidv4 } from "uuid";
import { encryptPassword } from  "../../utils/hashPasswords.js"
import { jwtCreate } from "../../utils/jsonWebToken.js";
import { emailJwt } from "../../configEnv.js";
import { queryBatchExe } from "../../composables/queryBatchExe.js";
import { useSocketInit } from "../../composables/useSocketInit.js";
import { emitUpdateUser } from "../../composables/useSocketRoutes.js";
import {
  vlteConfirmation,
  vlteCancelTime,
} from "../../services/ValidationPlayers.js";

// CANCELACIÓN DE ASISTENCIA A CS
/** Necesita obligatoriamente req.cookie */
export const cancelConfirmation = async ({body, cookies}, res) => {
  const jwtCookie = cookies?.refreshToken;
  const { id, update_on } = body; 
  const [isInSquad] = await pool.query(
    "SELECT * FROM players WHERE id_signup_player = ?",
    [id]
  );
  if (Object.keys(isInSquad)?.length) {
    return res.status(400).json({
      status: 400,
      resp: {
        mssg: "Está en grupo!",
      },
    });
  }
   const {granted} =  vlteCancelTime(res, update_on);
   if(granted){
    const querys = [
      {
        cols: "DELETE FROM attendance_notifications WHERE id_signup_player  = ?",
        values: [id],
      },
      {
        cols: "DELETE FROM confirmed_players WHERE id_signup_player = ? ",
        values: [id],
      },
      {
        cols: "UPDATE signup_players SET attendance = ? WHERE id = ?",
        values: [false, id],
      },
    ];
  
    const { status, error, success } = await queryBatchExe(
      querys,
      "Asistencia cancelada",
      "Error. Vuelva a intentar",
      () => {
        const { allPlayers, allconfirmPlayers, allNotifications } =
          useSocketInit(io);
        allconfirmPlayers();
        allPlayers();
        allNotifications();
      }
    );
  
    res.status(status).json({ status, resp: success ?? error });
  
    await emitUpdateUser(jwtCookie, [
      {
        name: "userInit",
        data: [], // userInit(emit de ruta) se pasa vacío ya que sus valores lo retorna queryBatchExe()
      },
    ]);
  }

 
};

// CONFIRMACIÓN DE ASISTENCIA A CS
/** Necesita obligatoriamente req.cookie */
export const assisConfirmation = async ({body, cookies}, res) => {
  const { nick, ctr, id, name_server } = body;

  try {
    const jwtCookie = cookies?.refreshToken;

    const querysVlteConfirmation = [
      {
        cols: "SELECT * FROM confirmed_players WHERE id_signup_player = ?",
        values: [id],
      },
      {
        cols: "SELECT * FROM players WHERE id_signup_player = ?",
        values: [id],
      },
    ];
    // Validate confirmation
    const { granted } = await vlteConfirmation(res ,querysVlteConfirmation);
    if (granted) {
      const [{ insertId }] = await pool.query(
        "INSERT INTO confirmed_players VALUES (?,?,?,?,?,?)",
        [null, true, nick, ctr, id, name_server]
      );
      const confirmUpdateQuerys = [
        {
          cols: "INSERT INTO attendance_notifications (id, id_signup_player, active) VALUES (?,?,?) ",
          values: [null, id, true],
        },
        {
          cols: "UPDATE signup_players SET attendance = ? WHERE id = ?",
          values: [true, id],
        },
      ];
      await queryBatchExe(confirmUpdateQuerys);
      // Notificación al confirmar asistencia.
      // await pool.query(
      //   "INSERT INTO attendance_notifications (id, id_signup_player, active) VALUES (?,?, ?) ",
      //   [null, id, true]
      // );
      // // Actualizar campo attendance del jugador que confirma
      // await pool.query(
      //   "UPDATE signup_players SET attendance = ? WHERE id = ?",
      //   [true, id]
      // );

      const [attNotify] = await pool.query(
        // eslint-disable-next-line quotes
        `SELECT * FROM attendance_notifications attn INNER JOIN confirmed_players cp ON attn.id_signup_player = cp.id_signup_player WHERE cp.id = ?`,
        [insertId]
      );

      // // Actualizar campo attendance del jugador que confirma
      // await pool.query(
      //   "UPDATE signup_players SET attendance = ? WHERE id = ?",
      //   [true, id]
      // );

      const [[player]] = await pool.query(
        "SELECT * FROM confirmed_players WHERE id = ?",
        [insertId]
      );

      const { resp } = await emitUpdateUser(
        jwtCookie,
        [
          {
            name: "assisConfirmation",
            data: player,
          },
          {
            name: "attNotify",
            data: attNotify[0],
          },
          {
            name: "userInit",
            data: [], // userInit(emit de ruta) se pasa vacío ya que sus valores lo retorna queryBatchExe()
          },
        ],
        () => {
          const { allPlayers } = useSocketInit(io);
          allPlayers();
        }
      );
      return res.status(200).json({
        status: 200,
        resp: { body: player, mssg: "Confirmado" },
        usuario: resp,
      });
    }

  } catch (error) {
    console.log(error);

    res.status(400).json({
      status: 400,
      resp: { mssg: "Error al confirmar" },
    });
  }
};

// REGISTRO DE JUGADORES
// !Válidar email únicos
export const signUpPlayer = async ({ body }, res) => {
  const { email, password, nick, name, ctr, phone, nameServer } = body;

  const id = uuidv4();
  const inserts = [
    {
      cols: "INSERT INTO sign_in (id,email,password, user_role, role_permissions, status, token) VALUES(?,?,?,?,?,?,?)",
      values: [
        id,
        email,
        encryptPassword(password),
        "USUARIO",
        '["USUARIO", "USUARIO"]',
        false,
        jwtCreate(email, emailJwt.jwt).token,
      ],
    },

    {
      cols: "INSERT INTO signup_players  (id, nick, name , ctr, phone, attendance, name_server, id_signin)  VALUES(?,?,?,?,?,?,?,?)",
      values: [id, nick, name, ctr, phone, false, nameServer, id],
    },
  ];

  const { status, error, success } = await queryBatchExe(
    inserts,
    "Perfil Creado",
    "Error. Vuelva a intentar",
    () => {
      const { allPlayers } = useSocketInit(io);
      allPlayers();
    }
  );

  res.status(status).json({ status, resp: success ?? error });
};

// INFORMACIÓN POR JUGADOR (UNO)
export const player = async ({ body: { id } }, res) => {
  const querys = [
    {
      cols: `SELECT signup_players.*, squad.name_tactic, players.leader
      FROM players
      INNER JOIN signup_players ON players.id_signup_player = signup_players.id
      INNER JOIN squad ON squad.id = players.id_squad 
      WHERE id_squad = (SELECT id_squad FROM players WHERE id_signup_player = ?)`,
      values: [id],
    },
    {
      cols: `SELECT sp.id, sp.nick, sp.name, sp.ctr, sp.phone, sp.attendance, sp.name_server 
      FROM signup_players sp 
      INNER JOIN sign_in si on sp.id_signin = si.id 
      WHERE si.id = ?`,
      values: [id],
    },
  ];

  const { status, error, success } = await queryBatchExe(
    querys,
    "Datos de usuario",
    "Error en datos de usuario"
  );

  res.status(status).json({ status, resp: success ?? error });
};
