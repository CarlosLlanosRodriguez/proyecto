const jwt = require('jsonwebtoken');
const { request, response } = require('express');
const { validationResult } = require('express-validator');
const UsuarioModel = require('../models/usuario.model');

class AuthController {
    static async login(req = request, res = response) {
        try {

            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

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

    static async getPerfil(req, res) {
        try {
        const usuario = await UsuarioModel.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
            });
        }

        const usuarioRespuesta = {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            telefono: usuario.telefono,
            activo: usuario.activo,
            rol: {
                id: usuario.rol_id,
                nombre: usuario.rol_nombre,
                descripcion: usuario.rol_descripcion
            },
            creado_en: usuario.creado_en,
            actualizado_en: usuario.actualizado_en
        };

        return res.status(200).json({
            success: true,
            data: usuarioRespuesta
        });

        } catch (error) {
            console.error('Error al obtener perfil:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener perfil',
                error: error.message
            });
        }
    }

    static async cambiarPassword(req, res) {
        try {
        // Validar errores
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array()
            });
        }

        const { passwordActual, passwordNuevo } = req.body;
        const usuarioId = req.usuario.id;

        // 1. Obtener usuario con password_hash
        const usuario = await UsuarioModel.findByEmail(req.usuario.email);

        // 2. Verificar contraseña actual
        const passwordMatch = await UsuarioModel.comparePassword(passwordActual, usuario.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
            success: false,
            message: 'La contraseña actual es incorrecta'
            });
        }

        // 3. Actualizar contraseña
        await UsuarioModel.updatePassword(usuarioId, passwordNuevo);

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

        } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
        }
    }

}

module.exports = AuthController;