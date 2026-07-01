// essa funcao libera o back end para receber requisicoes de qualquer origem (front end) porque o front end e o back end estao em portas diferentes, entao o navegador bloqueia por padrao //
function aplicarCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// essa funcao envia uma resposta em formato JSON para o front end //
function enviarJson(res, statusCode, dados) {
  aplicarCors(res);

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });

  res.end(JSON.stringify(dados));
}

function lerCorpoJson(req) {
  return new Promise((resolve, reject) => {
    let corpo = "";

    req.on("data", (pedaco) => {
      corpo += pedaco;
    });

    req.on("end", () => {
      try {
        const dados = corpo ? JSON.parse(corpo) : {};
        resolve(dados);
      } catch (erro) {
        reject(new Error("JSON inválido no corpo da requisição."));
      }
    });

    req.on("error", (erro) => {
      reject(erro);
    });
  });
}

module.exports = {
  aplicarCors,
  enviarJson,
  lerCorpoJson,
};
