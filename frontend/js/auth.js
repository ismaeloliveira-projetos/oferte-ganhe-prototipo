const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const btnEntrar = document.getElementById("btnEntrar");
const btnText = document.getElementById("btnText");
const btnLoading = document.getElementById("btnLoading");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");

function buscarPerfilPorId(perfilId) {
  const banco = carregarBanco();
  return banco.perfis.find((perfil) => perfil.id === perfilId);
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = emailInput.value;
  const senha = senhaInput.value;

  btnEntrar.disabled = true;
  btnEntrar.classList.add("loading");
  btnText.classList.add("hidden");
  btnLoading.classList.remove("hidden");
  loginError.classList.add("hidden");

  setTimeout(() => {
    const banco = carregarBanco();

    const usuario = banco.usuarios.find(
      (u) => u.email === email && u.senha === senha,
    );

    const perfilDoUsuario = usuario
      ? buscarPerfilPorId(usuario.perfilId)
      : null;

    if (usuario && perfilDoUsuario) {
      btnEntrar.classList.remove("loading");
      btnEntrar.classList.add("success");
      btnText.textContent = "✓ Logado!";
      btnText.classList.remove("hidden");
      btnLoading.classList.add("hidden");

      const usuarioLogado = {
        email: usuario.email,
        matricula: usuario.matricula,
        nome: usuario.nome,
        perfil: perfilDoUsuario.nome,
        lojaId: usuario.lojaId || null,
        permissoes: perfilDoUsuario.permissoes,
      };

      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } else {
      btnEntrar.disabled = false;
      btnEntrar.classList.remove("loading");
      btnText.classList.remove("hidden");
      btnLoading.classList.add("hidden");
      loginError.classList.remove("hidden");
      loginError.textContent = "E-mail ou senha incorretos!";
      senhaInput.value = "";
      emailInput.focus();
    }
  }, 1500);
});

const btnEsqueciSenha = document.getElementById("btnEsqueciSenha");
const modal = document.getElementById("modal");
const overlay = document.getElementById("overlay");

const btnRecuperar = document.getElementById("btnRecuperar");
const emailRecuperar = document.getElementById("emailRecuperar");

const msgError = document.getElementById("msgError");
const msgSuccess = document.getElementById("msgSuccess");

// emails válidos (simulação)
const usuarios = [
  "admin@empresa.com",
  "operador@empresa.com",
  "loja@empresa.com",
];

// abrir modal
btnEsqueciSenha.addEventListener("click", () => {
  modal.classList.add("active");
  overlay.classList.add("active");

  msgError.classList.add("hidden");
  msgSuccess.classList.add("hidden");
});

// fechar clicando fora
overlay.addEventListener("click", fecharModal);

function fecharModal() {
  modal.classList.remove("active");
  overlay.classList.remove("active");
}

let tokenGerado = null;
let emailRecuperacao = null;

btnRecuperar.addEventListener("click", () => {
  const email = emailRecuperar.value.trim().toLowerCase();

  msgError.classList.add("hidden");
  msgSuccess.classList.add("hidden");

  if (!usuarios.includes(email)) {
    msgError.textContent = "E-mail inválido!";
    msgError.classList.remove("hidden");
    return;
  }

  tokenGerado = Math.floor(100000 + Math.random() * 900000);
  emailRecuperacao = email;
  console.log("TOKEN GERADO:", tokenGerado);

  msgSuccess.textContent = "Token enviado com sucesso para seu e-mail!";
  msgSuccess.classList.remove("hidden");

  setTimeout(() => {
    fecharModal();
    emailRecuperar.value = "";
    abrirModalReset();
  }, 1500);
});

function abrirModalReset() {
  document.getElementById("modalReset").classList.add("active");
  overlay.classList.add("active");
}

function fecharModalReset() {
  document.getElementById("modalReset").classList.remove("active");
  overlay.classList.remove("active");
  tokenGerado = null;
  emailRecuperacao = null;
}

overlay.addEventListener("click", () => {
  fecharModal();
  fecharModalReset();
});

document.getElementById("btnConfirmarReset").addEventListener("click", () => {
  const tokenDigitado = document.getElementById("tokenDigitado").value.trim();
  const novaSenha = document.getElementById("novaSenha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;
  const msgErrorReset = document.getElementById("msgErrorReset");
  const msgSuccessReset = document.getElementById("msgSuccessReset");

  msgErrorReset.classList.add("hidden");
  msgSuccessReset.classList.add("hidden");

  if (String(tokenDigitado) !== String(tokenGerado)) {
    msgErrorReset.textContent = "Token inválido!";
    msgErrorReset.classList.remove("hidden");
    return;
  }

  if (novaSenha.length < 6) {
    msgErrorReset.textContent = "A senha deve ter pelo menos 6 caracteres.";
    msgErrorReset.classList.remove("hidden");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    msgErrorReset.textContent = "As senhas não coincidem!";
    msgErrorReset.classList.remove("hidden");
    return;
  }

  msgSuccessReset.textContent = "Senha redefinida com sucesso!";
  msgSuccessReset.classList.remove("hidden");

  setTimeout(() => {
    fecharModalReset();
    document.getElementById("tokenDigitado").value = "";
    document.getElementById("novaSenha").value = "";
    document.getElementById("confirmarSenha").value = "";
  }, 1500);
});
