const { validationResult } = require('express-validator');
const TorneoModel = require('../models/torneo.model');

class TorneosController {

    static async listar(req, res) {
        try {
            const torneos = await TorneoModel.findAll();

            return res.status(200).json({
                success: true,
                message: 'Torneos obtenidos exitosamente',
                data: torneos,
                total: torneos.length
            });

        } catch (error) {
            console.error('Error al listar torneos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener torneos',
                error: error.message
            });
        }
    }

    static async crear(req, res) {
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

            const { nombre, disciplina, temporada, fecha_inicio, fecha_fin, estado, descripcion } = req.body;

            // El organizador es el usuario autenticado
            const organizador_id = req.usuario.id;

            // Validar que fecha_fin >= fecha_inicio
            if (new Date(fecha_fin) < new Date(fecha_inicio)) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de fin debe ser mayor o igual a la fecha de inicio'
                });
            }

            // Crear el torneo
            const nuevoTorneo = await TorneoModel.create({
                nombre,
                disciplina,
                temporada,
                fecha_inicio,
                fecha_fin,
                estado: estado || 'planificado',
                organizador_id,
                descripcion
            });

            return res.status(201).json({
                success: true,
                message: 'Torneo creado exitosamente',
                data: nuevoTorneo
            });

        } catch (error) {
            console.error('Error al crear torneo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear torneo',
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

            const torneo = await TorneoModel.findById(id);

            if (!torneo) {
                return res.status(404).json({
                    success: false,
                    message: 'Torneo no encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Torneo encontrado',
                data: torneo
            });

        } catch (error) {
            console.error('Error al obtener torneo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener torneo',
                error: error.message
            });
        }
    }

    static async actualizar(req, res) {
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

            // Verificar que el torneo exista
            const torneoExiste = await TorneoModel.findById(id);
            if (!torneoExiste) {
                return res.status(404).json({
                    success: false,
                    message: 'Torneo no encontrado'
                });
            }

            // Verificar permisos:
            // - Si es admin, puede editar cualquier torneo
            // - Si es organizador, solo puede editar sus propios torneos
            const esAdmin = req.usuario.rol_nombre === 'admin';
            const esOrganizadorDelTorneo = torneoExiste.organizador_id === req.usuario.id;

            if (!esAdmin && !esOrganizadorDelTorneo) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este torneo'
                });
            }

            // Validar fechas si se están actualizando
            if (req.body.fecha_inicio && req.body.fecha_fin) {
                if (new Date(req.body.fecha_fin) < new Date(req.body.fecha_inicio)) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de fin debe ser mayor o igual a la fecha de inicio'
                    });
                }
            }

            // Actualizar el torneo
            const torneoActualizado = await TorneoModel.update(id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Torneo actualizado exitosamente',
                data: torneoActualizado
            });

        } catch (error) {
            console.error('Error al actualizar torneo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar torneo',
                error: error.message
            });
        }
    }

    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Verificar que el torneo exista
            const torneo = await TorneoModel.findById(id);
            if (!torneo) {
                return res.status(404).json({
                    success: false,
                    message: 'Torneo no encontrado'
                });
            }

            // Eliminar el torneo (cascada eliminará equipos, jugadores, partidos)
            await TorneoModel.delete(id);

            return res.status(200).json({
                success: true,
                message: 'Torneo eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar torneo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar torneo',
                error: error.message
            });
        }
    }

    static async misTorneos(req, res) {
        try {
            const organizador_id = req.usuario.id;

            const torneos = await TorneoModel.findByOrganizador(organizador_id);

            return res.status(200).json({
                success: true,
                message: 'Tus torneos obtenidos exitosamente',
                data: torneos,
                total: torneos.length
            });

        } catch (error) {
            console.error('Error al obtener torneos del organizador:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener torneos',
                error: error.message
            });
        }
    }

    static async obtenerPorEstado(req, res) {
        try {
            const { estado } = req.params;

            // Validar que el estado sea válido
            const estadosValidos = ['planificado', 'en_curso', 'finalizado', 'cancelado'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: `Estado inválido. Debe ser: ${estadosValidos.join(', ')}`
                });
            }

            const torneos = await TorneoModel.findByEstado(estado);

            return res.status(200).json({
                success: true,
                message: `Torneos con estado '${estado}' obtenidos exitosamente`,
                data: torneos,
                total: torneos.length
            });

        } catch (error) {
            console.error('Error al obtener torneos por estado:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener torneos',
                error: error.message
            });
        }
    }

    static async obtenerEquipos(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Verificar que el torneo exista
            const torneo = await TorneoModel.findById(id);
            if (!torneo) {
                return res.status(404).json({
                    success: false,
                    message: 'Torneo no encontrado'
                });
            }

            const equipos = await TorneoModel.getEquipos(id);

            return res.status(200).json({
                success: true,
                message: 'Equipos del torneo obtenidos exitosamente',
                data: equipos,
                total: equipos.length,
                torneo: {
                    id: torneo.id,
                    nombre: torneo.nombre,
                    disciplina: torneo.disciplina
                }
            });

        } catch (error) {
            console.error('Error al obtener equipos del torneo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener equipos',
                error: error.message
            });
        }
    }

}

module.exports = TorneosController;