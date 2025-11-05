const jwt = require('jsonwebtoken');
const { request, response } = require('express');
const UsuarioModel = require('../models/usuario.model');

class AuthController {
    static async login(req = request, res = response) {
        try {
            const { email, password } = req.body;

            const usuario = await UsuarioModel.findByEmail(email);

            if(!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas',
                });
            }

            if(!usuario.activo) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario inactivo. Contacte al administrador',
                });
            }

            const passwordMatch = await UsuarioModel.comparePassword(password, usuario.password_hash);

            if(!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas',
                });
            }

            const payload = {
                id: usuario.id,
                email: usuario.email,
                rol_id: usuario.rol_id,
                rol_nombre: usuario.rol_nombre
            };

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            const usuarioRepuesta = {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                telefono: usuario.telefono,
                rol: {
                    id: usuario.rol_id,
                    nombre: usuario.rol_nombre,
                    descripcion: usuario.rol_descripcion
                }
            };

            return res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    usuario: usuarioRepuesta
                }
            });

        } catch(error) {
            console.error('Error en login: ', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;