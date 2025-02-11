"use strict";

require("dotenv").config();
var express = require("express");
var cors = require("cors");
var admin = require("firebase-admin");
var path = require("path");
var app = express();
var PORT = 3000;
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "senha_padrao";

var admin = require("firebase-admin");

var serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Substitui \n codificados por uma nova linha
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

var db = admin.firestore();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para salvar mensagens no Firestore
app.post("/salvar", function (req, res) {
  var { from, to, message } = req.body;
  from = from.trim() === "" ? "Anônimo" : from;

  // Salvar a mensagem no Firestore
  var mensagensRef = db.collection("cartinha");
  mensagensRef
    .add({
      from: from,
      to: to,
      message: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Adiciona um timestamp
    })
    .then(() => {
      res.json({ success: true, message: "Mensagem salva com sucesso!" });
    })
    .catch((error) => {
      console.error("Erro ao salvar a mensagem:", error);
      res.status(500).json({ success: false, message: "Erro ao salvar a mensagem." });
    });
});

// Rota para visualizar mensagens (somente para administradores)
app.get("/visualizar", function (req, res) {
  var password = req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).send("<h3 style='color: red; text-align: center;'>Acesso negado!</h3>");
  }

  // Consultar mensagens no Firestore
  var mensagensRef = db.collection("cartinha");
  mensagensRef
    .orderBy("timestamp", "desc") // Ordena por timestamp
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return res.status(404).send("<h3 style='color: red; text-align: center;'>Nenhuma mensagem encontrada!</h3>");
      }

      var html = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mensagens</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="container mt-5">
            <h2 class="text-center">Mensagens Recebidas</h2>
            <div class="row">`;

      snapshot.forEach((doc) => {
        var msg = doc.data();
        html += `
          <div class="col-md-4">
              <div class="card mb-3">
                  <div class="card-body">
                      <h5 class="card-title">De: ${msg.from}</h5>
                      <h6 class="card-subtitle mb-2 text-muted">Para: ${msg.to}</h6>
                      <p class="card-text">${msg.message}</p>
                  </div>
              </div>
          </div>`;
      });

      html += `
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>`;

      res.send(html);
    })
    .catch((error) => {
      console.error("Erro ao recuperar mensagens:", error);
      res.status(500).send("<h3 style='color: red; text-align: center;'>Erro ao carregar mensagens.</h3>");
    });
});

// Rota para baixar as mensagens como um arquivo Excel
app.get("/baixar", function (req, res) {
  var password = req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Acesso negado!" });
  }

  // Consultar mensagens no Firestore e gerar um arquivo Excel
  var mensagensRef = db.collection("cartinha");
  mensagensRef
    .orderBy("timestamp", "desc")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return res.status(404).json({ error: "Nenhum arquivo encontrado!" });
      }

      // Gerar dados para o Excel
      var data = [["De", "Para", "Mensagem", "Timestamp"]];
      snapshot.forEach((doc) => {
        var msg = doc.data();
        data.push([msg.from, msg.to, msg.message, msg.timestamp.toDate()]);
      });

      var XLSX = require("xlsx");
      var ws = XLSX.utils.aoa_to_sheet(data);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mensagens");

      // Salvar o arquivo e enviá-lo
      var filePath = path.join(__dirname, "mensagens.xlsx");
      XLSX.writeFile(wb, filePath);
      res.download(filePath, "mensagens.xlsx");
    })
    .catch((error) => {
      console.error("Erro ao gerar o arquivo Excel:", error);
      res.status(500).json({ error: "Erro ao gerar o arquivo Excel." });
    });
});

// Rota para a página inicial (se necessário)
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Iniciar o servidor
app.listen(PORT, function () {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
