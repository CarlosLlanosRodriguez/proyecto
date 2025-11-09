const express = require('express');
const { body, param } = require('express-validator');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const UsuariosController = require('../controllers/usuarios.controller');

const router = express.Router();

router.use(verificarToken, esAdmin);

//Routes
router.get('/', UsuariosController.listar);

router.post(
    '/',
    [
        // Validación de nombre
        body('nombre')
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
            .trim(),
        
        // Validación de apellido
        body('apellido')
            .notEmpty().withMessage('El apellido es requerido')
            .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
            .trim(),
        
        // Validación de email
        body('email')
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Debe ser un email válido')
            .normalizeEmail()
            .toLowerCase(),
        
        // Validación de contraseña
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)'),
        
        // Validación de rol
        body('rol_id')
            .notEmpty().withMessage('El rol es requerido')
            .isInt({ min: 1, max: 4 }).withMessage('El rol debe ser un número entre 1 y 4 (1=admin, 2=organizador, 3=delegado, 4=participante)')
            .toInt(),
        
        // Validación de teléfono (opcional)
        body('telefono')
            .optional({ nullable: true, checkFalsy: true })
            .matches(/^[0-9+\-() ]+$/)
            .withMessage('El teléfono solo puede contener números, +, -, paréntesis y espacios')
            .isLength({ min: 7, max: 30 })
            .withMessage('El teléfono debe tener entre 7 y 30 caracteres')
    ],
    UsuariosController.crearUsuario
);

router.get('/:id', UsuariosController.obtenerPorId);

router.put(
    '/:id',
    [
        // Validación de ID en los parámetros
        param('id')
            .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
            .toInt(),
        
        // Validación de nombre (opcional)
        body('nombre')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
            .trim(),
        
        // Validación de apellido (opcional)
        body('apellido')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
            .trim(),
        
        // Validación de email (opcional)
        body('email')
            .optional()
            .isEmail().withMessage('Debe ser un email válido')
            .normalizeEmail()
            .toLowerCase(),
        
        // Validación de rol (opcional)
        body('rol_id')
            .optional()
            .isInt({ min: 1, max: 4 }).withMessage('El rol debe ser un número entre 1 y 4')
            .toInt(),
        
        // Validación de teléfono (opcional)
        body('telefono')
            .optional({ nullable: true, checkFalsy: true })
            .matches(/^[0-9+\-() ]+$/)
            .withMessage('El teléfono solo puede contener números, +, -, paréntesis y espacios')
            .isLength({ min: 7, max: 30 })
            .withMessage('El teléfono debe tener entre 7 y 30 caracteres'),
        
        // Validación de activo (opcional)
        body('activo')
            .optional()
            .isBoolean().withMessage('El campo activo debe ser true o false')
            .toBoolean()
    ],
    UsuariosController.actualizarUsuario
);

router.put(
    '/:id/password',
    [
        param('id')
            .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
            .toInt(),
        
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial')
    ],
    UsuariosController.actualizarPasswordUsuario
);

router.delete('/:id', UsuariosController.eliminarUsuario);

module.exports = router;