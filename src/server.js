require('dotenv').config()

const app = require('./app');
const { testConexionDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
    try {
        await testConexionDB();
        
        app.listen(PORT, () => {
            console.log(`servidor iniciado en el puerto ${PORT}...`);
        });
    } catch(error) {
        console.log('Error al iniciar el servidor');        
    }
}

iniciarServidor()