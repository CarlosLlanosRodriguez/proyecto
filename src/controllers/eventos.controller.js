const { validationResult } = require('express-validator');
const EventoModel = require('../models/evento.model');
const PartidoModel = require('../models/partido.model');
const JugadorModel = require('../models/jugador.model');

class EventosController {

    static async listar(req, res) {
        try {
            const eventos = await EventoModel.findAll();

            return res.status(200).json({
                success: true,
                message: 'Eventos obtenidos exitosamente',
                data: eventos,
                total: eventos.length
            });

        } catch (error) {
            console.error('Error al listar eventos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener eventos',
                error: error.message
            });
        }
    }

    static async crear(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { partido_id, jugador_id, tipo, minuto, descripcion } = req.body;

            // Verificar que el partido existe
            const partido = await PartidoModel.findById(partido_id);
            if (!partido) {
                return res.status(404).json({
                    success: false,
                    message: 'El partido especificado no existe'
                });
            }

            // Verificar que el jugador existe
            const jugador = await JugadorModel.findById(jugador_id);
            if (!jugador) {
                return res.status(404).json({
                    success: false,
                    message: 'El jugador especificado no existe'
                });
            }

            // VALIDACIÓN: El jugador debe pertenecer a uno de los equipos del partido
            const jugadorPerteneceAlPartido = await EventoModel.jugadorPerteneceAlPartido(
                jugador_id,
                partido_id
            );

            if (!jugadorPerteneceAlPartido) {
                return res.status(400).json({
                    success: false,
                    message: 'El jugador no pertenece a ninguno de los equipos de este partido',
                    detalle: {
                        jugador: {
                            nombre: `${jugador.nombre} ${jugador.apellido}`,
                            equipo: jugador.equipo_nombre
                        },
                        partido: {
                            local: partido.equipo_local_nombre,
                            visitante: partido.equipo_visitante_nombre
                        }
                    }
                });
            }

            // Crear el evento
            const nuevoEvento = await EventoModel.create({
                partido_id,
                jugador_id,
                tipo,
                minuto,
                descripcion
            });

            return res.status(201).json({
                success: true,
                message: 'Evento registrado exitosamente',
                data: nuevoEvento
            });

        } catch (error) {
            console.error('Error al crear evento:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear evento',
                error: error.message
            });
        }
    }

    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            const evento = await EventoModel.findById(id);

            if (!evento) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Evento encontrado',
                data: evento
            });

        } catch (error) {
            console.error('Error al obtener evento:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener evento',
                error: error.message
            });
        }
    }

    static async actualizar(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { id } = req.params;

            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Verificar que el evento existe
            const eventoExiste = await EventoModel.findById(id);
            if (!eventoExiste) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            // Verificar permisos
            const esAdmin = req.usuario.rol_nombre === 'admin';
            const esDelegado = req.usuario.rol_nombre === 'delegado';
            const esOrganizadorDelTorneo = eventoExiste.torneo_organizador_id === req.usuario.id;

            if (!esAdmin && !esDelegado && !esOrganizadorDelTorneo) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este evento'
                });
            }

            // Actualizar el evento
            const eventoActualizado = await EventoModel.update(id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Evento actualizado exitosamente',
                data: eventoActualizado
            });

        } catch (error) {
            console.error('Error al actualizar evento:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar evento',
                error: error.message
            });
        }
    }

    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            // Verificar que el evento existe
            const evento = await EventoModel.findById(id);
            if (!evento) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }

            // Verificar permisos
            const esAdmin = req.usuario.rol_nombre === 'admin';
            const esOrganizadorDelTorneo = evento.torneo_organizador_id === req.usuario.id;

            if (!esAdmin && !esOrganizadorDelTorneo) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este evento'
                });
            }

            // Eliminar el evento
            await EventoModel.delete(id);

            return res.status(200).json({
                success: true,
                message: 'Evento eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar evento:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar evento',
                error: error.message
            });
        }
    }

    static async obtenerPorPartido(req, res) {
        try {
            const { partidoId } = req.params;

            if (isNaN(partidoId) || partidoId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de partido inválido'
                });
            }

            const partido = await PartidoModel.findById(partidoId);
            if (!partido) {
                return res.status(404).json({
                    success: false,
                    message: 'Partido no encontrado'
                });
            }

            const eventos = await EventoModel.findByPartido(partidoId);

            return res.status(200).json({
                success: true,
                message: 'Eventos del partido obtenidos exitosamente',
                data: eventos,
                total: eventos.length,
                partido: {
                    id: partido.id,
                    local: partido.equipo_local_nombre,
                    visitante: partido.equipo_visitante_nombre,
                    marcador: `${partido.marcador_local} - ${partido.marcador_visitante}`
                }
            });

        } catch (error) {
            console.error('Error al obtener eventos del partido:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener eventos',
                error: error.message
            });
        }
    }

    static async obtenerGoleadores(req, res) {
        try {
            const { partidoId } = req.params;

            if (isNaN(partidoId) || partidoId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de partido inválido'
                });
            }

            const partido = await PartidoModel.findById(partidoId);
            if (!partido) {
                return res.status(404).json({
                    success: false,
                    message: 'Partido no encontrado'
                });
            }

            const goleadores = await EventoModel.getGoleadores(partidoId);

            return res.status(200).json({
                success: true,
                message: 'Goleadores del partido obtenidos exitosamente',
                data: goleadores,
                total: goleadores.length,
                partido: {
                    id: partido.id,
                    local: partido.equipo_local_nombre,
                    visitante: partido.equipo_visitante_nombre,
                    marcador: `${partido.marcador_local} - ${partido.marcador_visitante}`
                }
            });

        } catch (error) {
            console.error('Error al obtener goleadores:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener goleadores',
                error: error.message
            });
        }
    }

}

module.exports = EventosController;