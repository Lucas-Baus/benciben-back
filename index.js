require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error de conexión a Mongo:", err));

// 2. Modelo de la Consulta
const consultaSchema = new mongoose.Schema({
    nombre: String,
    empresa: String,
    email: String,
    mensaje: String,
    fecha: { type: Date, default: Date.now }
});

const Consulta = mongoose.model('Consulta', consultaSchema, 'consultas');

// 3. Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Recordá: las 16 letras sin espacios
    }
});

// 4. Ruta POST para recibir el formulario
app.post('/api/consulta', async (req, res) => {
    console.log("📩 Datos recibidos:", req.body);

    try {
        // PASO A: Guardar en MongoDB
        const nuevaConsulta = new Consulta(req.body);
        await nuevaConsulta.save();
        console.log("💾 Guardado en MongoDB con éxito");

        // PASO B: Responder al Frontend inmediatamente
        // Esto libera el botón de "Enviando..." en tu web
        res.status(201).json({ status: 'ok', mensaje: 'Consulta guardada' });

        // PASO C: Intentar enviar el mail (sin bloquear el resto)
        const mailOptions = {
            from: `"Web Benciben" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `📦 Nueva consulta de ${req.body.nombre}`,
            html: `
                <h2>Nuevo mensaje de presupuesto</h2>
                <p><strong>Nombre:</strong> ${req.body.nombre}</p>
                <p><strong>Empresa:</strong> ${req.body.empresa}</p>
                <p><strong>Email:</strong> ${req.body.email}</p>
                <p><strong>Mensaje:</strong> ${req.body.mensaje}</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("⚠️ El mensaje se guardó en DB pero el mail falló:", error.message);
            } else {
                console.log("📧 Mail enviado con éxito:", info.messageId);
            }
        });

    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ status: 'error', detalle: error.message });
    }
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});