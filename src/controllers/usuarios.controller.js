const { validationResult } = require('express-validator');
const UsuarioModel = require('../models/usuario.model');

class UsuariosController {

    static async listar(req, res) {
        try {
            const usuarios = await UsuarioModel.findAll();

            return res.status(200).json({
                success: true,
                message: 'Usuarios obtenidos exitosamente',
                data: usuarios,
                total: usuarios.length
            });

        } catch (error) {
        console.error('Error al listar usuarios:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    }

    static async crearUsuario(req, res) {
        try {
            // Validar errores de express-validator
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
                });
            }

            const { nombre, apellido, email, password, rol_id, telefono } = req.body;

            // Verificar que el email no esté registrado
            const emailExiste = await UsuarioModel.emailExists(email);
            if (emailExiste) {
                return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
                });
            }

            // Crear el usuario
            const nuevoUsuario = await UsuarioModel.createUser({
                nombre,
                apellido,
                email,
                password,
                rol_id,
                telefono
            });

            return res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: nuevoUsuario
            });

        } catch (error) {
        console.error('Error al crear usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear usuario',
                error: error.message
            });
        }
    }

    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            const usuario = await UsuarioModel.findById(id);

            if (!usuario) {
                return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Usuario encontrado',
                data: usuario
            });

        } catch (error) {
        console.error('Error al obtener usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener usuario',
                error: error.message
            });
        }
    }

    static async actualizarUsuario(req, res) {
        try {
            // Validar errores de express-validator
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
                });
            }

            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                success: false,
                message: 'ID inválido'
                });
            }

            // Verificar que el usuario exista
            const usuarioExiste = await UsuarioModel.findById(id);
            if (!usuarioExiste) {
                return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
                });
            }

            // Prevenir que un admin se desactive a sí mismo
            if (req.body.activo === false && parseInt(id) === req.usuario.id) {
                return res.status(400).json({
                success: false,
                message: 'No puedes desactivar tu propia cuenta'
                });
            }

            // Si se está cambiando el email, verificar que no esté en uso
            if (req.body.email && req.body.email !== usuarioExiste.email) {
                const emailExiste = await UsuarioModel.emailExists(req.body.email);
                if (emailExiste) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado por otro usuario'
                });
                }
            }

            // Actualizar el usuario
            const usuarioActualizado = await UsuarioModel.updateUser(id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: usuarioActualizado
            });

        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar usuario',
                error: error.message
            });
        }
    }

    static async actualizarPasswordUsuario(req, res) {
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

            const { id } = req.params;
            const { password } = req.body;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                success: false,
                message: 'ID inválido'
                });
            }

            // Verificar que el usuario exista
            const usuario = await UsuarioModel.findById(id);
            if (!usuario) {
                return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
                });
            }

            // Actualizar contraseña
            await UsuarioModel.updatePassword(id, password);

            return res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar contraseña',
                error: error.message
            });
        }
    }

    static async eliminarUsuario(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                success: false,
                message: 'ID inválido'
                });
            }

            // Verificar que el usuario exista
            const usuario = await UsuarioModel.findById(id);
            if (!usuario) {
                return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
                });
            }

            // Prevenir que un admin se elimine a sí mismo
            if (parseInt(id) === req.usuario.id) {
                return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
                });
            }

            // Eliminar (soft delete: marcar como inactivo)
            await UsuarioModel.deleteUser(id);

            return res.status(200).json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar usuario',
                error: error.message
            });
        }
    }

}

module.exports = UsuariosController;