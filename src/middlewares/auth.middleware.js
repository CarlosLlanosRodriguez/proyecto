const { request, response } = require('express');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const verificarToken = async (req = request, res = response, next) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó token de autenticación'
            });
        }   
        const token = authHeader.split(' ')[1];
        if(!token) {
            return res.status(401).json({
                success: false,
                message: 'Formato de token invalido'
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const usuario = await UsuarioModel.findById(decode.id);

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (!usuario.activo) {
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        req.usuario = {
            id: usuario.id,
            email: usuario.email,
            rol_id: usuario.rol_id,
            rol_nombre: usuario.rol_nombre
        };

        next();
    } catch(error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
    }
}

const verificarRol = (rolesPermitidos) => {
    return (req = request, res = response, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const tienePermiso = rolesPermitidos.includes(req.usuario.rol_nombre);

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso',
                rol_requerido: rolesPermitidos,
                tu_rol: req.usuario.rol_nombre
            });
        }

        next();
    };
}

const esAdmin = verificarRol(['admin']);

const esAdminOOrganizador = verificarRol(['admin', 'organizador']);

const esAdminOrganizadorODelegado = verificarRol(['admin', 'organizador', 'delegado']);

module.exports = {
    verificarToken,
    verificarRol,
    esAdmin,
    esAdminOOrganizador,
    esAdminOrganizadorODelegado
}