const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');

const { verificarToken, verificarRol, esAdmin, esAdminOOrganizador, esAdminOrganizadorODelegado } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post(
    '/login', 
    [
        body('email')
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Debe ser un email válido')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({min: 6}).withMessage('La contraseña debe tener al menos 6 caracteres')
    ],
    AuthController.login);

router.get('/perfil', verificarToken, AuthController.getPerfil);

router.put(
    '/cambiar-password',
    [
        verificarToken, // Debe estar autenticado
        // Validaciones
        body('passwordActual')
        .notEmpty().withMessage('La contraseña actual es requerida'),
        
        body('passwordNuevo')
        .notEmpty().withMessage('La nueva contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
        
        body('passwordNuevo')
        .custom((value, { req }) => value !== req.body.passwordActual)
        .withMessage('La nueva contraseña debe ser diferente a la actual')
    ],
    AuthController.cambiarPassword
);

router.get('/prueba-middleware', verificarToken, esAdmin, esAdminOOrganizador, esAdminOrganizadorODelegado, (req, res) => {
    res.json({
        msg: 'Prueba de middleware',
        usuario: req.usuario
    })
})

module.exports = router;