const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});


const testConexionDB = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Conexión exitosa a PostgreSQL');
        console.log('Hora del servidor DB:', result.rows[0].now);
        client.release(); // Liberar la conexión de vuelta al pool
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message);
        process.exit(1); // Detener la aplicación si no hay conexión
    }
};

const query = (text, params) => pool.query(text, params);

module.exports = {
    pool,
    query,
    testConexionDB
};