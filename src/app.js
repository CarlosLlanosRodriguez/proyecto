const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middlewares
app.use(helmet());

app.use(cors({
    origin: process.env.FORNTEND_URL || 'http://localhost:4200',
    credentials: true
}));

app.use(morgan('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/info', (req, res) => {
    res.status(200).json({
        exito: true,
        mensaje: 'Api funcionando correctamente',
        tiempo_registro: new Date().toLocaleString(),
        tiempo_activo_servidor: process.uptime()
    });
});

// Rutas de la API
//Importar la ruta
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const torneosRoutes = require('./routes/torneos.routes');
const equiposRoutes = require('./routes/equipos.routes');
const jugadoresRoutes = require('./routes/jugadores.routes');
const partidosRoutes = require('./routes/partidos.routes');
const eventosRoutes = require('./routes/eventos.routes');

//Usar ruta
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/torneos', torneosRoutes);
app.use('/api/v1/equipos', equiposRoutes);
app.use('/api/v1/jugadores', jugadoresRoutes);
app.use('/api/v1/partidos', partidosRoutes);
app.use('/api/v1/eventos', eventosRoutes);

module.exports = app;