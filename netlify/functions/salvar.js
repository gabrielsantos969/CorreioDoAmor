// netlify/functions/salvar.js
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");

const upload = multer();
const filePath = "mensagens.xlsx";

exports.handler = async (event, context) => {
    if (event.httpMethod === "POST") {
        let { from, to, message } = JSON.parse(event.body);
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

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Mensagem salva com sucesso!" })
        };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};
