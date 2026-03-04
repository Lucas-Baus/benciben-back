const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- CONEXIÓN A MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error de conexión a Mongo:', err));

// --- MODELO DE DATOS ---
const ConsultaSchema = new mongoose.Schema({
  nombre: String,
  empresa: String,
  email: String,
  mensaje: String,
  fecha: { type: Date, default: Date.now }
});

const Consulta = mongoose.model('Consulta', ConsultaSchema);

// --- CONFIGURACIÓN DE NODEMAILER (CORREGIDA PARA RENDER) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Puerto compatible con Render
  secure: false, // Debe ser false para el puerto 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Evita bloqueos de seguridad en el servidor
  }
});

// --- RUTA PARA RECIBIR CONSULTAS ---
app.post('/api/consulta', async (req, res) => {
  const { nombre, empresa, email, mensaje } = req.body;

  try {
    // 1. Guardar en la base de datos
    const nuevaConsulta = new Consulta({ nombre, empresa, email, mensaje });
    await nuevaConsulta.save();
    console.log("💾 Consulta guardada en la base de datos");

    // 2. Enviar el correo electrónico
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'ventas.benciben@gmail.com', // Tu mail de ventas
      subject: `🚀 Nueva consulta web: ${nombre}`,
      text: `Has recibido una nueva consulta:\n\nNombre: ${nombre}\nEmpresa: ${empresa}\nEmail: ${email}\nMensaje: ${mensaje}`
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Mail enviado correctamente");

    res.status(200).json({ message: 'Consulta procesada con éxito' });

  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    // Aunque el mail falle, si se guardó en DB avisamos
    res.status(500).json({ error: 'Hubo un problema al procesar la consulta' });
  }
});

// --- PUERTO DINÁMICO PARA RENDER ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});