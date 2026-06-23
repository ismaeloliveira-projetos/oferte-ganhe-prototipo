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

// enviar recuperação
btnRecuperar.addEventListener("click", () => {
  const email = emailRecuperar.value.trim().toLowerCase();

  msgError.classList.add("hidden");
  msgSuccess.classList.add("hidden");

  // validação
  if (!usuarios.includes(email)) {
    msgError.textContent = "E-mail inválido!";
    msgError.classList.remove("hidden");
    return;
  }

  // gerar token
  const token = Math.floor(100000 + Math.random() * 900000);
  console.log("TOKEN GERADO:", token);

  msgSuccess.textContent = "Token enviado com sucesso para seu e-mail!";
  msgSuccess.classList.remove("hidden");

  // fecha automático
  setTimeout(() => {
    fecharModal();
    emailRecuperar.value = "";
  }, 2000);
});
