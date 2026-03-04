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
  .catch(err => console.error('❌ Error de conexión:', err));

// --- MODELO DE DATOS ---
const Consulta = mongoose.model('Consulta', new mongoose.Schema({
  nombre: String,
  empresa: String,
  email: String,
  mensaje: String,
  fecha: { type: Date, default: Date.now }
}));

// --- CONFIGURACIÓN DE NODEMAILER (SERVICE + PUERTO 587) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',    // <--- CAMBIO DE GMAIL SERVICE
  host: 'smtp.gmail.com',
  port: 587,           // <--- PUERTO 587 EXPLÍCITO
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificación de conexión
transporter.verify((error) => {
  if (error) console.log("❌ Error inicial de mail:", error.message);
  else console.log("📧 ¡Servidor de mail listo (Gmail Service + 587)!");
});

// --- RUTA POST (RESPUESTA INMEDIATA AL FRONT) ---
app.post('/api/consulta', async (req, res) => {
  const { nombre, empresa, email, mensaje } = req.body;

  try {
    // 1. Guardar en DB primero
    const nuevaConsulta = new Consulta({ nombre, empresa, email, mensaje });
    await nuevaConsulta.save();
    console.log("💾 Consulta guardada en DB");

    // 2. Responder al Front al toque (Para que no salga el cartel de error)
    res.status(200).json({ message: '¡Consulta enviada con éxito!' });

    // 3. Mandar el mail de fondo
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'ventas.benciben@gmail.com',
      subject: `🚀 Nueva consulta web: ${nombre}`,
      text: `Nombre: ${nombre}\nEmpresa: ${empresa}\nEmail: ${email}\nMensaje: ${mensaje}`
    }, (err, info) => {
      if (err) console.log("❌ Fallo el mail de fondo:", err.message);
      else console.log("📧 Mail enviado correctamente");
    });

  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Benciben v6 (FINAL) corriendo en puerto ${PORT}`);
});