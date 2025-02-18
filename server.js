require('dotenv').config();
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

// Inicializa Firebase Firestore
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar Multer (Upload de Imagens)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

// Rota para receber check-in
app.post('/checkin', upload.single('foto'), async (req, res) => {
  try {
    // Faz upload da foto para o Cloudinary
    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: 'veiculos' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        // Salvar os dados no Firebase Firestore
        const docRef = await db.collection('checkins').add({
          placa: req.body.placa,
          modelo: req.body.modelo,
          foto: result.secure_url,
          data: new Date().toISOString()
        });

        res.json({ message: 'Check-in salvo!', id: docRef.id, foto: result.secure_url });
      }
    );

    uploadResult.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
