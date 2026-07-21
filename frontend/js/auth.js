const API_LOGIN_URL = "http://localhost:3000/api/auth/login";

function mostrarErroLogin(mensagem) {
  const loginError = document.getElementById("loginError");

  if (!loginError) {
    alert(mensagem);
    return;
  }

  loginError.textContent = mensagem;
  loginError.classList.remove("hidden");
}

function esconderErroLogin() {
  const loginError = document.getElementById("loginError");

  if (loginError) {
    loginError.classList.add("hidden");
  }
}

function ativarLoadingLogin() {
  const btnEntrar = document.getElementById("btnEntrar");
  const btnText = document.getElementById("btnText");
  const btnLoading = document.getElementById("btnLoading");

  if (btnEntrar) {
    btnEntrar.disabled = true;
  }

  if (btnText) {
    btnText.classList.add("hidden");
  }

  if (btnLoading) {
    btnLoading.classList.remove("hidden");
  }
}

function desativarLoadingLogin() {
  const btnEntrar = document.getElementById("btnEntrar");
  const btnText = document.getElementById("btnText");
  const btnLoading = document.getElementById("btnLoading");

  if (btnEntrar) {
    btnEntrar.disabled = false;
  }

  if (btnText) {
    btnText.classList.remove("hidden");
  }

  if (btnLoading) {
    btnLoading.classList.add("hidden");
  }
}

async function fazerLogin(email, senha) {
  const resposta = await fetch(API_LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      senha,
    }),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao fazer login.");
  }

  return resultado;
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    esconderErroLogin();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
      mostrarErroLogin("Informe e-mail e senha.");
      return;
    }

    ativarLoadingLogin();

    try {
      const resultado = await fazerLogin(email, senha);

      if (!resultado.token) {
        throw new Error("Token de autenticação não retornado pelo servidor.");
      }

      localStorage.setItem("usuarioLogado", JSON.stringify(resultado.usuario));
      localStorage.setItem("tokenAuth", resultado.token);

      window.location.href = "dashboard.html";
    } catch (erro) {
      console.error(erro);
      mostrarErroLogin(erro.message || "Erro ao fazer login.");
    } finally {
      desativarLoadingLogin();
    }
  });
}

function abrirModalRecuperacao() {
  const overlay = document.getElementById("overlay");
  const modal = document.getElementById("modal");

  if (overlay) {
    overlay.classList.add("active");
  }

  if (modal) {
    modal.classList.add("active");
  }
}

function fecharModaisRecuperacao() {
  const overlay = document.getElementById("overlay");
  const modal = document.getElementById("modal");
  const modalReset = document.getElementById("modalReset");

  if (overlay) {
    overlay.classList.remove("active");
  }

  if (modal) {
    modal.classList.remove("active");
  }

  if (modalReset) {
    modalReset.classList.remove("active");
  }
}

const btnEsqueciSenha = document.getElementById("btnEsqueciSenha");

if (btnEsqueciSenha) {
  btnEsqueciSenha.addEventListener("click", function () {
    abrirModalRecuperacao();
  });
}

const overlay = document.getElementById("overlay");

if (overlay) {
  overlay.addEventListener("click", function () {
    fecharModaisRecuperacao();
  });
}

const btnRecuperar = document.getElementById("btnRecuperar");

if (btnRecuperar) {
  btnRecuperar.addEventListener("click", function () {
    const msgError = document.getElementById("msgError");
    const msgSuccess = document.getElementById("msgSuccess");

    if (msgError) {
      msgError.classList.add("hidden");
    }

    if (msgSuccess) {
      msgSuccess.textContent =
        "Recuperação de senha será conectada ao backend em uma próxima etapa.";
      msgSuccess.classList.remove("hidden");
    }
  });
}

const btnConfirmarReset = document.getElementById("btnConfirmarReset");

if (btnConfirmarReset) {
  btnConfirmarReset.addEventListener("click", function () {
    const msgErrorReset = document.getElementById("msgErrorReset");

    if (msgErrorReset) {
      msgErrorReset.textContent =
        "Redefinição de senha ainda não está conectada ao backend.";
      msgErrorReset.classList.remove("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const mensagemLogin = sessionStorage.getItem("mensagemLogin");

  if (mensagemLogin) {
    mostrarErroLogin(mensagemLogin);
    sessionStorage.removeItem("mensagemLogin");
  }
});
