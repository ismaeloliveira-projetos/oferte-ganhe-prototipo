const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const btnEntrar = document.getElementById("btnEntrar");
const btnText = document.getElementById("btnText");
const btnLoading = document.getElementById("btnLoading");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");

const usuarioMockado = {
  email: "admin@empresa.com",
  senha: "123456",
  nome: "Administrador",
  perfil: "Administrador"
};

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = emailInput.value;
  const senha = senhaInput.value;

  // Ativar carregamento
  btnEntrar.disabled = true;
  btnEntrar.classList.add("loading");
  btnText.classList.add("hidden");
  btnLoading.classList.remove("hidden");
  loginError.classList.add("hidden");

  // Simular requisição
  setTimeout(() => {
    if (email === usuarioMockado.email && senha === usuarioMockado.senha) {
      // Sucesso
      btnEntrar.classList.remove("loading");
      btnEntrar.classList.add("success");
      btnText.textContent = "✓ Logado!";
      btnText.classList.remove("hidden");
      btnLoading.classList.add("hidden");
      
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioMockado));
      
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } else {
      // Erro
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