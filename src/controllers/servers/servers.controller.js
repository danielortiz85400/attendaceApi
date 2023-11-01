import { useSocketInit } from "../../composables/useSocketInit.js";
import { queryBatchExe } from "../../composables/queryBatchExe.js";
import { io } from "../../index.js";

//* CREAR SERVIDORES
export const createServer = async ({ body }, res) => {
  const query = [
    {
      cols: "INSERT INTO servers (name) VALUES (?)",
      values: [body.name],
    },
  ];
  const { status, error, success } = await queryBatchExe(
    query,
    "Servidor creado",
    "Error. Intente de nuevo.",
    () => {
      const { allServers } = useSocketInit(io);
      allServers();
    }
  );

  const keyCode = status === 200 ? "success" : "error";
  res.status(status).json({ status, [keyCode]: success ?? error });
};

//* REMOVER SERVIDOR
export const removeServer = async ({ body }, res) => {
  const query = [
    {
      cols: "DELETE FROM servers WHERE name  = ?",
      values: [body.name],
    },
  ];
  const { status, error, success } = await queryBatchExe(
    query,
    "Servidor removido",
    "Error. Intente de nuevo.",
    () => {
      const { allServers } = useSocketInit(io);
      allServers();
    }
  );
  const keyCode = status === 200 ? "success" : "error";
  res.status(status).json({ status, [keyCode]: success ?? error });
};
