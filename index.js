const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- CONEXIÓN A MONGODB ATLAS ---
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

// --- CONFIGURACIÓN DE NODEMAILER (MODO SERVICE: GMAIL) ---
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// --- RUTA PARA RECIBIR CONSULTAS ---
app.post('/api/consulta', async (req, res) => {
  const { nombre, empresa, email, mensaje } = req.body;

  try {
    // 1. Guardar en la base de datos (Esto ya te funcionaba bien)
    const nuevaConsulta = new Consulta({ nombre, empresa, email, mensaje });
    await nuevaConsulta.save();
    console.log("💾 Consulta guardada en la base de datos");

    // 2. Enviar el correo electrónico
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'ventas.benciben@gmail.com', 
      subject: `🚀 Nueva consulta web de: ${nombre}`,
      text: `Datos del contacto:\n\nNombre: ${nombre}\nEmpresa: ${empresa}\nEmail: ${email}\nMensaje: ${mensaje}`
    };

    // Usamos await para asegurarnos de que el proceso espere al envío
    await transporter.sendMail(mailOptions);
    console.log("📧 Mail enviado correctamente");

    res.status(200).json({ message: '¡Consulta enviada con éxito!' });

  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    // Enviamos una respuesta de error para que el Front sepa que algo falló
    res.status(500).json({ error: 'Error al procesar la consulta' });
  }
});

// --- PUERTO PARA RENDER ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});