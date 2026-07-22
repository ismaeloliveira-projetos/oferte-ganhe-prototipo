const API_BASE_URL = "http://localhost:3000";

const formRedefinirSenha = document.getElementById("formRedefinirSenha");
const inputNovaSenha = document.getElementById("novaSenha");
const inputConfirmarSenha = document.getElementById("confirmarSenha");
const mensagemRedefinicao = document.getElementById("mensagemRedefinicao");
const btnRedefinirSenha = document.getElementById("btnRedefinirSenha");

const parametrosUrl = new URLSearchParams(window.location.search);
const tokenRedefinicao = parametrosUrl.get("token");

function mostrarMensagemRedefinicao(texto, tipo = "erro") {
  mensagemRedefinicao.textContent = texto;
  mensagemRedefinicao.classList.remove("hidden");
  mensagemRedefinicao.classList.remove("alert-error");
  mensagemRedefinicao.classList.remove("alert-success");

  if (tipo === "sucesso") {
    mensagemRedefinicao.classList.add("alert-success");
  } else {
    mensagemRedefinicao.classList.add("alert-error");
  }
}

function esconderMensagemRedefinicao() {
  mensagemRedefinicao.textContent = "";
  mensagemRedefinicao.classList.add("hidden");
}

function bloquearFormularioRedefinicao() {
  inputNovaSenha.disabled = true;
  inputConfirmarSenha.disabled = true;
  btnRedefinirSenha.disabled = true;
}

if (!tokenRedefinicao) {
  mostrarMensagemRedefinicao(
    "Token de redefinição não encontrado. Solicite um novo link de recuperação.",
  );

  bloquearFormularioRedefinicao();
}

formRedefinirSenha.addEventListener("submit", async function (event) {
  event.preventDefault();

  const novaSenha = inputNovaSenha.value.trim();
  const confirmarSenha = inputConfirmarSenha.value.trim();

  if (!tokenRedefinicao) {
    mostrarMensagemRedefinicao(
      "Token de redefinição não encontrado. Solicite um novo link de recuperação.",
    );
    return;
  }

  if (!novaSenha || !confirmarSenha) {
    mostrarMensagemRedefinicao("Preencha a nova senha e a confirmação.");
    return;
  }

  if (novaSenha.length < 6) {
    mostrarMensagemRedefinicao(
      "A nova senha deve ter pelo menos 6 caracteres.",
    );
    return;
  }

  if (novaSenha !== confirmarSenha) {
    mostrarMensagemRedefinicao("As senhas informadas não conferem.");
    return;
  }

  try {
    btnRedefinirSenha.disabled = true;
    btnRedefinirSenha.textContent = "Redefinindo...";
    esconderMensagemRedefinicao();

    const resposta = await fetch(`${API_BASE_URL}/api/auth/redefinir-senha`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: tokenRedefinicao,
        novaSenha,
      }),
    });

    const dados = await resposta.json().catch(function () {
      return {};
    });

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível redefinir a senha.");
    }

    const mensagemServidor =
      dados.mensagem || "Senha redefinida com sucesso. Faça login novamente.";

    mostrarMensagemRedefinicao(mensagemServidor, "sucesso");

    bloquearFormularioRedefinicao();

    sessionStorage.setItem("mensagemLogin", mensagemServidor);
    sessionStorage.setItem("mensagemLoginTipo", "sucesso");

    setTimeout(function () {
      window.location.href = "login.html";
    }, 1800);
  } catch (erro) {
    mostrarMensagemRedefinicao(erro.message, "erro");

    btnRedefinirSenha.disabled = false;
    btnRedefinirSenha.textContent = "Redefinir senha";
  }
});
