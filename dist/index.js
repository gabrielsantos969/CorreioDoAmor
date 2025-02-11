"use strict";

require("dotenv").config();
var express = require("express");
var cors = require("cors");
var multer = require("multer");
var XLSX = require("xlsx");
var fs = require("fs");
var path = require("path");
var app = express();
var upload = multer();
var PORT = 3000;
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "senha_padrao";
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
var filePath = "mensagens.xlsx";
app.post("/salvar", upload.none(), function (req, res) {
  var _req$body = req.body,
    from = _req$body.from,
    to = _req$body.to,
    message = _req$body.message;
  from = from.trim() === "" ? "Anônimo" : from;
  var workbook;
  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath);
  } else {
    workbook = XLSX.utils.book_new();
  }
  var sheetName = "Mensagens";
  if (!workbook.Sheets[sheetName]) {
    var newSheet = XLSX.utils.aoa_to_sheet([["De", "Para", "Mensagem"]]);
    XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
  }
  var worksheet = workbook.Sheets[sheetName];
  var data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1
  });
  data.push([from, to, message]);
  var newWorksheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;
  XLSX.writeFile(workbook, filePath);
  res.json({
    success: true,
    message: "Mensagem salva com sucesso!"
  });
});
app.get("/visualizar", function (req, res) {
  var password = req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).send("<h3 style='color: red; text-align: center;'>Acesso negado!</h3>");
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("<h3 style='color: red; text-align: center;'>Nenhuma mensagem encontrada!</h3>");
  }
  var workbook = XLSX.readFile(filePath);
  var worksheet = workbook.Sheets["Mensagens"];
  var data = XLSX.utils.sheet_to_json(worksheet);
  var html = "\n    <!DOCTYPE html>\n    <html lang=\"pt-br\">\n    <head>\n        <meta charset=\"UTF-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n        <title>Mensagens</title>\n        <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n    </head>\n    <body class=\"container mt-5\">\n        <h2 class=\"text-center\">Mensagens Recebidas</h2>\n        <div class=\"row\">";
  data.forEach(function (msg) {
    html += "\n        <div class=\"col-md-4\">\n            <div class=\"card mb-3\">\n                <div class=\"card-body\">\n                    <h5 class=\"card-title\">De: ".concat(msg.De, "</h5>\n                    <h6 class=\"card-subtitle mb-2 text-muted\">Para: ").concat(msg.Para, "</h6>\n                    <p class=\"card-text\">").concat(msg.Mensagem, "</p>\n                </div>\n            </div>\n        </div>");
  });
  html += "</div>\n        <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\"></script>\n    </body>\n    </html>";
  res.send(html);
});
app.get("/baixar", function (req, res) {
  var password = req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({
      error: "Acesso negado!"
    });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: "Nenhum arquivo encontrado!"
    });
  }
  res.download(filePath, "mensagens.xlsx");
});
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.listen(PORT, function () {
  console.log("Servidor rodando em http://localhost:".concat(PORT));
});
