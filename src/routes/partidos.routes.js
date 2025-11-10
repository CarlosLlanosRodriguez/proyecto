const express = require('express');
const { body, param } = require('express-validator');
const PartidosController = require('../controllers/partidos.controller');
const { verificarToken, esAdminOrganizadorODelegado } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', PartidosController.listar);

router.post(
    '/',
    [
        verificarToken,
        esAdminOrganizadorODelegado,

        body('torneo_id')
            .notEmpty().withMessage('El ID del torneo es requerido')
            .isInt({ min: 1 }).withMessage('El ID del torneo debe ser un número positivo')
            .toInt(),

        body('equipo_local_id')
            .notEmpty().withMessage('El ID del equipo local es requerido')
            .isInt({ min: 1 }).withMessage('El ID del equipo local debe ser un número positivo')
            .toInt(),

        body('equipo_visitante_id')
            .notEmpty().withMessage('El ID del equipo visitante es requerido')
            .isInt({ min: 1 }).withMessage('El ID del equipo visitante debe ser un número positivo')
            .toInt()
            .custom((value, { req }) => {
                if (value === req.body.equipo_local_id) {
                    throw new Error('El equipo local y visitante no pueden ser el mismo');
                }
                return true;
            }),

        body('fecha')
            .notEmpty().withMessage('La fecha del partido es requerida')
            .isISO8601().withMessage('La fecha debe ser válida (YYYY-MM-DD HH:MM:SS)')
            .toDate(),

        body('lugar')
            .optional()
            .isLength({ max: 200 }).withMessage('El lugar no puede exceder 200 caracteres')
            .trim(),

        body('estado')
            .optional()
            .isIn(['pendiente', 'en_curso', 'finalizado', 'suspendido', 'cancelado'])
            .withMessage('Estado debe ser: pendiente, en_curso, finalizado, suspendido o cancelado'),

        body('observaciones')
            .optional()
            .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres')
            .trim()
    ],
    PartidosController.crear
);

router.get('/:id', PartidosController.obtenerPorId);

router.put(
    '/:id',
    [
        verificarToken,
        esAdminOrganizadorODelegado,

        param('id')
            .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
            .toInt(),

        body('fecha')
            .optional()
            .isISO8601().withMessage('La fecha debe ser válida (YYYY-MM-DD HH:MM:SS)')
            .toDate(),

        body('lugar')
            .optional()
            .isLength({ max: 200 }).withMessage('El lugar no puede exceder 200 caracteres')
            .trim(),

        body('marcador_local')
            .optional()
            .isInt({ min: 0 }).withMessage('El marcador local debe ser un número positivo o cero')
            .toInt(),

        body('marcador_visitante')
            .optional()
            .isInt({ min: 0 }).withMessage('El marcador visitante debe ser un número positivo o cero')
            .toInt(),

        body('estado')
            .optional()
            .isIn(['pendiente', 'en_curso', 'finalizado', 'suspendido', 'cancelado'])
            .withMessage('Estado debe ser: pendiente, en_curso, finalizado, suspendido o cancelado'),

        body('observaciones')
            .optional()
            .isLength({ max: 500 }).withMessage('Las observaciones no pueden exceder 500 caracteres')
            .trim()
    ],
    PartidosController.actualizar
);

router.delete(
    '/:id',
    [
        verificarToken,
        esAdminOrganizadorODelegado
    ],
    PartidosController.eliminar
);

router.get('/torneo/:torneoId', PartidosController.obtenerPorTorneo);

router.get('/equipo/:equipoId', PartidosController.obtenerPorEquipo);

router.get('/:id/eventos', PartidosController.obtenerEventos);

module.exports = router;
