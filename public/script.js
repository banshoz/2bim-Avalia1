// script.js
// O desenho agora é gerado no servidor (Pages Function).
// Esta página só envia o número e o id_token do Google, e exibe a resposta.

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  botaoBaixar.hidden = true;
  area.innerHTML = "";

  const numero = Number(campoNumero.value);

  if (!window.googleIdToken) {
    mensagem.textContent = "Entre com sua conta Google antes de desenhar.";
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${window.googleIdToken}`
      },
      body: JSON.stringify({ numero })
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Número inválido. Digite um inteiro entre 1 e 100.";
      return;
    }

    if (resposta.status === 401) {
      mensagem.textContent = "Sessão inválida. Entre com sua conta Google novamente.";
      return;
    }

    if (!resposta.ok) {
      mensagem.textContent = "Erro ao gerar o desenho. Tente novamente.";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch (erro) {
    mensagem.textContent = "Erro de conexão. Tente novamente.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
