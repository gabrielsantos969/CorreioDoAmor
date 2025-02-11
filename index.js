require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer();
const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "senha_padrao";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const filePath = "mensagens.xlsx";

app.post("/salvar", upload.none(), (req, res) => {
    let { from, to, message } = req.body;
    from = from.trim() === "" ? "Anônimo" : from;

    let workbook;
    if (fs.existsSync(filePath)) {
        workbook = XLSX.readFile(filePath);
    } else {
        workbook = XLSX.utils.book_new();
    }

    let sheetName = "Mensagens";
    if (!workbook.Sheets[sheetName]) {
        let newSheet = XLSX.utils.aoa_to_sheet([["De", "Para", "Mensagem"]]);
        XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
    }

    let worksheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    data.push([from, to, message]);

    let newWorksheet = XLSX.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = newWorksheet;
    XLSX.writeFile(workbook, filePath);

    res.json({ success: true, message: "Mensagem salva com sucesso!" });
});

app.get("/visualizar", (req, res) => {
    const { password } = req.query;
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).send("<h3 style='color: red; text-align: center;'>Acesso negado!</h3>");
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("<h3 style='color: red; text-align: center;'>Nenhuma mensagem encontrada!</h3>");
    }

    let workbook = XLSX.readFile(filePath);
    let worksheet = workbook.Sheets["Mensagens"];
    let data = XLSX.utils.sheet_to_json(worksheet);

    let html = `
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
    
    data.forEach(msg => {
        html += `
        <div class="col-md-4">
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">De: ${msg.De}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">Para: ${msg.Para}</h6>
                    <p class="card-text">${msg.Mensagem}</p>
                </div>
            </div>
        </div>`;
    });
    
    html += `</div>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>`;
    
    res.send(html);
});

app.get("/baixar", (req, res) => {
    const { password } = req.query;
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Acesso negado!" });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Nenhum arquivo encontrado!" });
    }

    res.download(filePath, "mensagens.xlsx");
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
