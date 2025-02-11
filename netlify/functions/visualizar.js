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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "senha_padrao";

exports.handler = async (event, context) => {
  const password = event.queryStringParameters.password;

  if (password !== ADMIN_PASSWORD) {
    return {
      statusCode: 403,
      body: "<h3 style='color: red; text-align: center;'>Acesso negado!</h3>",
      headers: {
        'Content-Type': 'text/html'
    }
    };
  }

  try {
    const snapshot = await db.collection("cartinha").orderBy("timestamp", "desc").get();
    
    if (snapshot.empty) {
      return {
        statusCode: 404,
        body: "<h3 style='color: red; text-align: center;'>Nenhuma mensagem encontrada!</h3>",
        headers: {
            'Content-Type': 'text/html'
        }
      };
    }

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

    snapshot.forEach((doc) => {
      const msg = doc.data();
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

    return {
      statusCode: 200,
      body: html,
      headers: {
        'Content-Type': 'text/html'
    }
    };
  } catch (error) {
    console.error("Erro ao recuperar mensagens:", error);
    return {
      statusCode: 500,
      body: "<h3 style='color: red; text-align: center;'>Erro ao carregar mensagens.</h3>",
      headers: {
        'Content-Type': 'text/html'
    }
    };
  }
};
