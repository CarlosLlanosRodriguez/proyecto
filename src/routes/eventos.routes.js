const express = require('express');
const { body, param } = require('express-validator');
const EventosController = require('../controllers/eventos.controller');
const { verificarToken, esAdminOrganizadorODelegado } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', EventosController.listar);

router.post(
    '/',
    [
        verificarToken,
        esAdminOrganizadorODelegado,

        body('partido_id')
            .notEmpty().withMessage('El ID del partido es requerido')
            .isInt({ min: 1 }).withMessage('El ID del partido debe ser un número positivo')
            .toInt(),

        body('jugador_id')
            .notEmpty().withMessage('El ID del jugador es requerido')
            .isInt({ min: 1 }).withMessage('El ID del jugador debe ser un número positivo')
            .toInt(),

        body('tipo')
            .notEmpty().withMessage('El tipo de evento es requerido')
            .isIn(['gol', 'tarjeta_amarilla', 'tarjeta_roja', 'cambio', 'autogol'])
            .withMessage('Tipo debe ser: gol, tarjeta_amarilla, tarjeta_roja, cambio o autogol'),

        body('minuto')
            .notEmpty().withMessage('El minuto es requerido')
            .isInt({ min: 0, max: 120 }).withMessage('El minuto debe estar entre 0 y 120')
            .toInt(),

        body('descripcion')
            .optional()
            .isLength({ max: 255 }).withMessage('La descripción no puede exceder 255 caracteres')
            .trim()
    ],
    EventosController.crear
);

router.get('/:id', EventosController.obtenerPorId);

router.put(
    '/:id',
    [
        verificarToken,
        esAdminOrganizadorODelegado,

        param('id')
            .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
            .toInt(),

        body('tipo')
            .optional()
            .isIn(['gol', 'tarjeta_amarilla', 'tarjeta_roja', 'cambio', 'autogol'])
            .withMessage('Tipo debe ser: gol, tarjeta_amarilla, tarjeta_roja, cambio o autogol'),

        body('minuto')
            .optional()
            .isInt({ min: 0, max: 120 }).withMessage('El minuto debe estar entre 0 y 120')
            .toInt(),

        body('descripcion')
            .optional()
            .isLength({ max: 255 }).withMessage('La descripción no puede exceder 255 caracteres')
            .trim()
    ],
    EventosController.actualizar
);

router.delete(
    '/:id',
    [
        verificarToken,
        esAdminOrganizadorODelegado
    ],
    EventosController.eliminar
);

router.get('/partido/:partidoId', EventosController.obtenerPorPartido);

router.get('/partido/:partidoId/goleadores', EventosController.obtenerGoleadores);

module.exports = router;