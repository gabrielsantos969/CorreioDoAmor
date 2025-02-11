const admin = require("firebase-admin");
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

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Método não permitido" }),
    };
  }

  const { from, to, message } = JSON.parse(event.body);
  const sanitizedFrom = from.trim() === "" ? "Anônimo" : from;

  try {
    await db.collection("cartinha").add({
      from: sanitizedFrom,
      to: to,
      message: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Mensagem salva com sucesso!" }),
    };
  } catch (error) {
    console.error("Erro ao salvar a mensagem:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Erro ao salvar a mensagem." }),
    };
  }
};
