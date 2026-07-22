const API_BASE_URL = "http://localhost:3000";

const formEsqueciSenha = document.getElementById("formEsqueciSenha");
const inputEmail = document.getElementById("email");
const mensagemRecuperacao = document.getElementById("mensagemRecuperacao");
const btnEnviarRecuperacao = document.getElementById("btnEnviarRecuperacao");

function mostrarMensagem(texto, tipo = "sucesso") {
  mensagemRecuperacao.textContent = texto;
  mensagemRecuperacao.className = `mensagem-formulario ${tipo}`;
}

formEsqueciSenha.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = inputEmail.value.trim();

  if (!email) {
    mostrarMensagem("Informe seu e-mail.", "erro");
    return;
  }

  try {
    btnEnviarRecuperacao.disabled = true;
    btnEnviarRecuperacao.textContent = "Enviando...";
    mostrarMensagem("", "");

    const resposta = await fetch(`${API_BASE_URL}/api/auth/esqueci-senha`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const dados = await resposta.json().catch(function () {
      return {};
    });

    if (!resposta.ok) {
      throw new Error(
        dados.erro || "Não foi possível solicitar a recuperação de senha.",
      );
    }

    mostrarMensagem(
      dados.mensagem ||
        "Se o e-mail estiver cadastrado, enviaremos um link para redefinição de senha.",
      "sucesso",
    );

    formEsqueciSenha.reset();
  } catch (erro) {
    mostrarMensagem(erro.message, "erro");
  } finally {
    btnEnviarRecuperacao.disabled = false;
    btnEnviarRecuperacao.textContent = "Enviar link de recuperação";
  }
});
