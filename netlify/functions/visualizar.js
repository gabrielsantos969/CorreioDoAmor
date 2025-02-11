// netlify/functions/visualizar.js
require("dotenv").config();
const XLSX = require("xlsx");
const fs = require("fs");

const filePath = "mensagens.xlsx";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "senha_padrao";

exports.handler = async (event, context) => {
    const { password } = event.queryStringParameters;
    if (password !== ADMIN_PASSWORD) {
        return {
            statusCode: 403,
            body: "<h3 style='color: red; text-align: center;'>Acesso negado!</h3>",
            headers: {
                'Content-Type': 'text/html'
            }
        };
    }

    if (!fs.existsSync(filePath)) {
        return {
            statusCode: 404,
            body: "<h3 style='color: red; text-align: center;'>Nenhuma mensagem encontrada!</h3>",
            headers: {
                'Content-Type': 'text/html'
            }
        };
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

    return {
        statusCode: 200,
        body: html,
        headers: {
            'Content-Type': 'text/html'
        }
    };
};
