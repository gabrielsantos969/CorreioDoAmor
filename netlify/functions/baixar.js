// netlify/functions/baixar.js
const fs = require("fs");
const path = require("path");

const filePath = "mensagens.xlsx";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "senha_padrao";

exports.handler = async (event, context) => {
    const { password } = event.queryStringParameters;
    if (password !== ADMIN_PASSWORD) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: "Acesso negado!" })
        };
    }

    if (!fs.existsSync(filePath)) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: "Nenhum arquivo encontrado!" })
        };
    }

    const fileContent = fs.readFileSync(filePath);
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=mensagens.xlsx"
        },
        body: fileContent.toString("base64"),
        isBase64Encoded: true
    };
};
