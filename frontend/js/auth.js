const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const usuarioMockado = {
  email: "admin@empresa.com",
  senha: "123456",
  nome: "Administrador",
  perfil: "Administrador"
};

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (email === usuarioMockado.email && senha === usuarioMockado.senha) {
    localStorage.setItem("usuarioLogado", JSON.stringify(usuarioMockado));
    window.location.href = "dashboard.html";
  } else {
    loginError.classList.remove("d-none");
  }
});