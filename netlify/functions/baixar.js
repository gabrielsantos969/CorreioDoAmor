const admin = require("firebase-admin");
const XLSX = require("xlsx");
const path = require("path");
require("dotenv").config();

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "senha_padrao";

exports.handler = async (event, context) => {
  const password = event.queryStringParameters.password;

  if (password !== ADMIN_PASSWORD) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Acesso negado!" }),
    };
  }

  try {
    const snapshot = await db.collection("cartinha").orderBy("timestamp", "desc").get();
    
    if (snapshot.empty) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Nenhuma mensagem encontrada!" }),
      };
    }

    const data = [["De", "Para", "Mensagem", "Timestamp"]];
    snapshot.forEach((doc) => {
      const msg = doc.data();
      data.push([msg.from, msg.to, msg.message, msg.timestamp.toDate()]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mensagens");

    const filePath = path.join(__dirname, "mensagens.xlsx");
    XLSX.writeFile(wb, filePath);

    return {
      statusCode: 200,
      body: "Arquivo gerado com sucesso",
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=mensagens.xlsx`,
      },
    };
  } catch (error) {
    console.error("Erro ao gerar o arquivo Excel:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao gerar o arquivo Excel." }),
    };
  }
};
