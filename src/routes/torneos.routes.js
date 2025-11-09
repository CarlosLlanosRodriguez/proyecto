const express = require('express');
const { body, param } = require('express-validator');
const { verificarToken, esAdmin, esAdminOOrganizador } = require('../middlewares/auth.middleware');
const TorneosController = require('../controllers/torneos.controller');

const router = express.Router();

router.get('/', TorneosController.listar);

router.post(
    '/',
    [
        verificarToken,
        esAdminOOrganizador,

        // Validación de nombre
        body('nombre')
            .notEmpty().withMessage('El nombre del torneo es requerido')
            .isLength({ min: 3, max: 150 }).withMessage('El nombre debe tener entre 3 y 150 caracteres')
            .trim(),

        // Validación de disciplina
        body('disciplina')
            .notEmpty().withMessage('La disciplina es requerida')
            .isLength({ min: 2, max: 50 }).withMessage('La disciplina debe tener entre 2 y 50 caracteres')
            .trim(),

        // Validación de temporada (opcional)
        body('temporada')
            .optional()
            .isLength({ max: 50 }).withMessage('La temporada no puede exceder 50 caracteres')
            .trim(),

        // Validación de fecha_inicio
        body('fecha_inicio')
            .notEmpty().withMessage('La fecha de inicio es requerida')
            .isISO8601().withMessage('La fecha de inicio debe ser válida (YYYY-MM-DD)')
            .toDate(),

        // Validación de fecha_fin
        body('fecha_fin')
            .notEmpty().withMessage('La fecha de fin es requerida')
            .isISO8601().withMessage('La fecha de fin debe ser válida (YYYY-MM-DD)')
            .toDate()
            .custom((value, { req }) => {
                if (new Date(value) < new Date(req.body.fecha_inicio)) {
                    throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
                }
                return true;
            }),

        // Validación de estado (opcional)
        body('estado')
            .optional()
            .isIn(['planificado', 'en_curso', 'finalizado', 'cancelado'])
            .withMessage('Estado debe ser: planificado, en_curso, finalizado o cancelado'),

        // Validación de descripción (opcional)
        body('descripcion')
            .optional()
            .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
            .trim()
    ],
    TorneosController.crear
);

router.get('/:id', TorneosController.obtenerPorId);

router.put(
    '/:id',
    [
        verificarToken,
        esAdminOOrganizador,

        // Validación de ID
        param('id')
            .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
            .toInt(),

        // Validación de nombre (opcional)
        body('nombre')
            .optional()
            .isLength({ min: 3, max: 150 }).withMessage('El nombre debe tener entre 3 y 150 caracteres')
            .trim(),

        // Validación de disciplina (opcional)
        body('disciplina')
            .optional()
            .isLength({ min: 2, max: 50 }).withMessage('La disciplina debe tener entre 2 y 50 caracteres')
            .trim(),

        // Validación de temporada (opcional)
        body('temporada')
            .optional()
            .isLength({ max: 50 }).withMessage('La temporada no puede exceder 50 caracteres')
            .trim(),

        // Validación de fecha_inicio (opcional)
        body('fecha_inicio')
            .optional()
            .isISO8601().withMessage('La fecha de inicio debe ser válida (YYYY-MM-DD)')
            .toDate(),

        // Validación de fecha_fin (opcional)
        body('fecha_fin')
            .optional()
            .isISO8601().withMessage('La fecha de fin debe ser válida (YYYY-MM-DD)')
            .toDate(),

        // Validación de estado (opcional)
        body('estado')
            .optional()
            .isIn(['planificado', 'en_curso', 'finalizado', 'cancelado'])
            .withMessage('Estado debe ser: planificado, en_curso, finalizado o cancelado'),

        // Validación de descripción (opcional)
        body('descripcion')
            .optional()
            .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
            .trim()
    ],
    TorneosController.actualizar
);

router.delete(
    '/:id',
    [
        verificarToken,
        esAdmin
    ],
    TorneosController.eliminar
);

router.get('/obtener/mis-torneos', verificarToken, TorneosController.misTorneos);

router.get('/estado/:estado', TorneosController.obtenerPorEstado);

router.get('/:id/equipos', TorneosController.obtenerEquipos);

module.exports = router;