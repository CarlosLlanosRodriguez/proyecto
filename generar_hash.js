/**
 * SCRIPT PARA GENERAR HASHES DE CONTRASEÑAS
 * 
 * Este script genera los hashes reales de bcrypt para las contraseñas.
 * Úsalo para actualizar el archivo init.sql con hashes reales.
 * 
 * IMPORTANTE: El script init.sql actual tiene hashes de ejemplo.
 * Ejecuta este script para generar los hashes reales.
 */

const bcrypt = require('bcryptjs');

const passwords = {
  admin: 'Admin123!',
  usuario: 'Password123!',
  delegados: 'Password123!',
  participantes: 'Password123!'
};

async function generarHashes() {
  console.log('===========================================');
  console.log('GENERANDO HASHES DE CONTRASEÑAS');
  console.log('===========================================\n');

  for (const [tipo, password] of Object.entries(passwords)) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log(`${tipo.toUpperCase()}:`);
    console.log(`  Contraseña: ${password}`);
    console.log(`  Hash: ${hash}`);
    console.log('');
  }

  console.log('===========================================');
  console.log('COPIA ESTOS HASHES AL ARCHIVO init.sql');
  console.log('===========================================');
}

// Verificar que bcryptjs esté instalado
try {
  generarHashes();
} catch (error) {
  console.error('Error: Asegúrate de haber ejecutado "npm install" primero');
  console.error(error.message);
}