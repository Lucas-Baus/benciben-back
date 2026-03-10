const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Resend } = require('resend'); // Cambiamos la librería
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuramos Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// --- CONEXIÓN A MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Conectado'))
  .catch(err => console.error('❌ Error Mongo:', err));

// --- MODELO DE DATOS ---
const Consulta = mongoose.model('Consulta', new mongoose.Schema({
  nombre: String, empresa: String, email: String, mensaje: String,
  fecha: { type: Date, default: Date.now }
}));

// --- RUTA POST ---
app.post('/api/consulta', async (req, res) => {
  const { nombre, empresa, email, mensaje } = req.body;

  try {
    // 1. Guardar en DB (Esto siempre funciona)
    const nuevaConsulta = new Consulta({ nombre, empresa, email, mensaje });
    await nuevaConsulta.save();
    console.log("💾 Consulta guardada en DB");

    // 2. Respuesta inmediata al Frontend (Cartel Verde)
    res.status(200).json({ message: '¡Consulta recibida con éxito!' });

    // 3. Enviar Mail vía API de Resend
    // Nota: Si no tenés dominio propio verificado, 
    // Resend solo deja enviar DESDE 'onboarding@resend.dev'
    const { data, error } = await resend.emails.send({
      from: 'Benciben Web <onboarding@resend.dev>', 
      to: 'ventas.benciben@gmail.com', // Tu mail donde recibís las consultas
      subject: `🚀 Nueva consulta: ${nombre}`,
      html: `
        <h2>Nueva consulta desde la web</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Empresa:</strong> ${empresa}</p>
        <p><strong>Email del cliente:</strong> ${email}</p>
        <p><strong>Mensaje:</strong> ${mensaje}</p>
      `
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
    } else {
      console.log("📧 Mail enviado con éxito vía API!", data.id);
    }

  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Error del servidor' });
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Benciben con Resend API corriendo`);
});