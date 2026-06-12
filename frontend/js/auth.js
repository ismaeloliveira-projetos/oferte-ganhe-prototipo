const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const btnEntrar = document.getElementById("btnEntrar");
const btnText = document.getElementById("btnText");
const btnLoading = document.getElementById("btnLoading");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");

// const usuarioMockado = {
//   email: "admin@empresa.com",
//   senha: "123456",
//   nome: "Administrador",
//   perfil: "Administrador"
// };

const usuariosMockados = [
  {
    email: "admin@empresa.com",
    senha: "123456",
    matricula: "707070",
    nome: "Administrador",
    perfil: "Administrador",
    permissoes: [
      "dashboard",
      "lojas",
      "usuarios",
      "perfis",
      "estoque",
      "envios",
      "recebimentos",
      "manutencao",
      "relatorios",
      "insights"
    ]
  },
  {
    email: "gestor@empresa.com",
    senha: "123456",
    matricula: "202020",
    nome: "Gestor",
    perfil: "Gestor",
    permissoes: [
      "dashboard",
      "lojas",
      "estoque",
      "envios",
      "recebimentos",
      "manutencao",
      "relatorios",
      "insights"
    ]
  },
  {
    email: "operador@empresa.com",
    senha: "123456",
    matricula: "101010",
    nome: "Operador",
    perfil: "Operador",
    permissoes: [
      "dashboard",
      "estoque",
      "envios",
      "recebimentos"
    ]
  }
];






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
    const usuario = usuariosMockados.find(
  (u) => u.email === email && u.senha === senha
);

if (usuario) {
  btnEntrar.classList.remove("loading");
  btnEntrar.classList.add("success");
  btnText.textContent = "✓ Logado!";
  btnText.classList.remove("hidden");
  btnLoading.classList.add("hidden");

  const usuarioLogado = {
    email: usuario.email,
    matricula: usuario.matricula,
    nome: usuario.nome,
    perfil: usuario.perfil,
    permissoes: usuario.permissoes
  };

  localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 800);
}

else {
      
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