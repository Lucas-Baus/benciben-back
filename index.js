const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- CONEXIÓN A MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error de conexión a Mongo:', err));

// --- MODELO DE DATOS ---
const Consulta = mongoose.model('Consulta', new mongoose.Schema({
  nombre: String,
  empresa: String,
  email: String,
  mensaje: String,
  fecha: { type: Date, default: Date.now }
}));

// --- CONFIGURACIÓN DE NODEMAILER (DEFINITIVA PARA RENDER) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // false para usar STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2"
  }
});

// Verificación de conexión inmediata al arrancar
transporter.verify((error) => {
  if (error) {
    console.log("❌ Error en la configuración de Gmail:", error);
  } else {
    console.log("📧 ¡Servidor de mail listo para enviar!");
  }
});

// --- RUTA POST ---
app.post('/api/consulta', async (req, res) => {
  const { nombre, empresa, email, mensaje } = req.body;

  try {
    // 1. Guardar en Base de Datos
    const nuevaConsulta = new Consulta({ nombre, empresa, email, mensaje });
    await nuevaConsulta.save();
    console.log("💾 Consulta guardada en DB");

    // 2. Enviar Mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'ventas.benciben@gmail.com',
      subject: `🚀 Nueva consulta web: ${nombre}`,
      text: `Datos del contacto:\n\nNombre: ${nombre}\nEmpresa: ${empresa}\nEmail: ${email}\nMensaje: ${mensaje}`
    });

    console.log("📧 Mail enviado correctamente");
    res.status(200).json({ message: '¡Consulta enviada con éxito!' });

  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    res.status(500).json({ error: 'Hubo un error al procesar' });
  }
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});