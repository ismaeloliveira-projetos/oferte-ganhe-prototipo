const nodemailer = require("nodemailer");
const AppError = require("../utils/appError");

function criarTrasporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new AppError("Configuração SMTP incompleta.", 500);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

async function enviarEmail({ para, assunto, html, texto }) {
  const transporter = criarTrasporter();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const resultado = await transporter.sendMail({
    from,
    to: para,
    subject: assunto,
    text: texto,
    html,
  });

  return resultado;
}

async function enviarEmailRedefinicaoSenha({ para, nome, link }) {
  const assunto = "Redefinição de senha | Oferte e Ganhe";

  const texto = `
Olá, ${nome || "usuário"}.

Recebemos uma solicitação para redefinir sua senha no Oferte e Ganhe.

Acesse o link abaixo para criar uma nova senha:
${link}

Esse link expira em breve. Se você não solicitou essa alteração, ignore este e-mail.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h2>Redefinição de senha</h2>

      <p>Olá, <strong>${nome || "usuário"}</strong>.</p>

      <p>
        Recebemos uma solicitação para redefinir sua senha no
        <strong>Oferte e Ganhe</strong>.
      </p>

      <p>
        Clique no botão abaixo para criar uma nova senha:
      </p>

      <p>
        <a
          href="${link}"
          style="
            display: inline-block;
            padding: 12px 18px;
            background: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          "
        >
          Redefinir senha
        </a>
      </p>

      <p style="font-size: 14px; color: #64748b;">
        Esse link expira em breve. Se você não solicitou essa alteração,
        ignore este e-mail.
      </p>
    </div>
  `;

  return enviarEmail({
    para,
    assunto,
    texto,
    html,
  });
}

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, function (caractere) {
    const caracteresEscapados = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return caracteresEscapados[caractere];
  });
}

async function enviarEmailNotificacaoEnvio({
  para,
  nome,
  codigoRemessa,
  quantidadeEnviada,
  lojaOrigem,
  lojaDestino,
}) {
  const assunto = `Nova remessa ${codigoRemessa} em trânsito | Oferte e Ganhe`;

  const texto = `
Olá, ${nome || "responsável pela loja"}.

Uma nova remessa foi enviada para a sua loja e está aguardando confirmação de recebimento.

Remessa: ${codigoRemessa}
Origem: ${lojaOrigem}
Destino: ${lojaDestino}
Quantidade enviada: ${quantidadeEnviada}
Status: PENDENTE

Acesse o sistema Oferte e Ganhe para confirmar o recebimento quando os talões chegarem.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h2>Nova remessa em trânsito</h2>

      <p>Olá, <strong>${escaparHtml(nome || "responsável pela loja")}</strong>.</p>

      <p>
        Uma nova remessa foi enviada para a sua loja e está aguardando
        confirmação de recebimento.
      </p>

      <ul>
        <li><strong>Remessa:</strong> ${escaparHtml(codigoRemessa)}</li>
        <li><strong>Origem:</strong> ${escaparHtml(lojaOrigem)}</li>
        <li><strong>Destino:</strong> ${escaparHtml(lojaDestino)}</li>
        <li><strong>Quantidade:</strong> ${quantidadeEnviada} talões</li>
        <li><strong>Status:</strong> PENDENTE</li>
      </ul>

      <p>
        Acesse o <strong>Oferte e Ganhe</strong> para confirmar o recebimento
        quando os talões chegarem.
      </p>
    </div>
  `;

  return enviarEmail({
    para,
    assunto,
    texto,
    html,
  });
}

module.exports = {
  enviarEmail,
  enviarEmailRedefinicaoSenha,
  enviarEmailNotificacaoEnvio,
};
