require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar Multer para armazenar arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Conectar ao MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Atlas conectado!"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

app.use(cors());
app.use(express.json());

// 🔹 Criar Modelo de Check-in
const CheckinSchema = new mongoose.Schema({
  data: String,
  cliente: String,
  telefone: String,
  modelo: String,
  placa: String,
  servico: String,
  fotos: [String], // URLs das imagens
  assinatura: String,
});

const Checkin = mongoose.model("Checkin", CheckinSchema);

// 📌 **UPLOAD de Fotos para Cloudinary**
app.post("/upload", upload.single("foto"), async (req, res) => {
  try {
    const image = req.file;
    const formData = new FormData();
    formData.append("file", image.buffer.toString("base64"));
    formData.append("upload_preset", process.env.CLOUDINARY_PRESET);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    res.json({ url: response.data.secure_url });
  } catch (error) {
    console.error("Erro ao enviar para o Cloudinary:", error);
    res.status(500).json({ error: "Erro ao salvar imagem" });
  }
});

// 📌 **Criar um Novo Check-in**
app.post("/checkin", async (req, res) => {
  try {
    const novoCheckin = new Checkin(req.body);
    await novoCheckin.save();
    res.status(201).json(novoCheckin);
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar check-in" });
  }
});

// 📌 **Listar Todos os Check-ins**
app.get("/checkins", async (req, res) => {
  try {
    const checkins = await Checkin.find().sort({ data: -1 });
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar check-ins" });
  }
});

// 📌 **Excluir Check-in**
app.delete("/checkin/:id", async (req, res) => {
  try {
    await Checkin.findByIdAndDelete(req.params.id);
    res.json({ message: "Check-in removido com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar check-in" });
  }
});

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
