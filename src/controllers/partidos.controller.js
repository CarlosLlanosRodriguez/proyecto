const { validationResult } = require('express-validator');
const PartidoModel = require('../models/partido.model');
const TorneoModel = require('../models/torneo.model');
const EquipoModel = require('../models/equipo.model');

class PartidosController {

    static async listar(req, res) {
        try {
            const partidos = await PartidoModel.findAll();

            return res.status(200).json({
                success: true,
                message: 'Partidos obtenidos exitosamente',
                data: partidos,
                total: partidos.length
            });

        } catch (error) {
            console.error('Error al listar partidos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener partidos',
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

            const {
                torneo_id,
                equipo_local_id,
                equipo_visitante_id,
                fecha,
                lugar,
                estado,
                observaciones
            } = req.body;

            // VALIDACIÓN 1: Verificar que el torneo existe
            const torneo = await TorneoModel.findById(torneo_id);
            if (!torneo) {
                return res.status(404).json({
                    success: false,
                    message: 'El torneo especificado no existe'
                });
            }

            // VALIDACIÓN 2: Verificar que ambos equipos existen
            const equipoLocal = await EquipoModel.findById(equipo_local_id);
            const equipoVisitante = await EquipoModel.findById(equipo_visitante_id);

            if (!equipoLocal || !equipoVisitante) {
                return res.status(404).json({
                    success: false,
                    message: 'Uno o ambos equipos no existen'
                });
            }

            // VALIDACIÓN 3: Equipos no pueden ser el mismo
            if (equipo_local_id === equipo_visitante_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Un equipo no puede jugar contra sí mismo'
                });
            }

            // VALIDACIÓN 4: Ambos equipos deben pertenecer al mismo torneo
            const equiposPerteneceAlTorneo = await PartidoModel.equiposPerteneceAlTorneo(
                equipo_local_id,
                equipo_visitante_id,
                torneo_id
            );

            if (!equiposPerteneceAlTorneo) {
                return res.status(400).json({
                    success: false,
                    message: 'Ambos equipos deben pertenecer al torneo especificado',
                    detalle: {
                        equipo_local: {
                            nombre: equipoLocal.equipo_nombre,
                            torneo: equipoLocal.torneo_nombre
                        },
                        equipo_visitante: {
                            nombre: equipoVisitante.equipo_nombre,
                            torneo: equipoVisitante.torneo_nombre
                        },
                        torneo_esperado: torneo.nombre
                    }
                });
            }

            // VALIDACIÓN 5: La fecha del partido debe estar dentro del rango del torneo
            const fechaDentroRango = await PartidoModel.fechaDentroRangoTorneo(fecha, torneo_id);

            if (!fechaDentroRango) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha del partido debe estar dentro del rango del torneo',
                    detalle: {
                        fecha_partido: fecha,
                        torneo_inicio: torneo.fecha_inicio,
                        torneo_fin: torneo.fecha_fin
                    }
                });
            }

            // Crear el partido
            const nuevoPartido = await PartidoModel.create({
                torneo_id,
                equipo_local_id,
                equipo_visitante_id,
                fecha,
                lugar,
                estado: estado || 'pendiente',
                observaciones
            });

            return res.status(201).json({
                success: true,
                message: 'Partido creado exitosamente',
                data: nuevoPartido
            });

        } catch (error) {
            console.error('Error al crear partido:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear partido',
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

            const partido = await PartidoModel.findById(id);

            if (!partido) {
                return res.status(404).json({
                    success: false,
                    message: 'Partido no encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Partido encontrado',
                data: partido
            });

        } catch (error) {
            console.error('Error al obtener partido:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener partido',
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

            // Verificar que el partido existe
            const partidoExiste = await PartidoModel.findById(id);
            if (!partidoExiste) {
                return res.status(404).json({
                    success: false,
                    message: 'Partido no encontrado'
                });
            }

            // Verificar permisos
            const esAdmin = req.usuario.rol_nombre === 'admin';
            const esDelegado = req.usuario.rol_nombre === 'delegado';
            const esOrganizadorDelTorneo = partidoExiste.torneo_organizador_id === req.usuario.id;

            if (!esAdmin && !esDelegado && !esOrganizadorDelTorneo) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este partido'
                });
            }

            // Si se actualiza la fecha, validar que esté en el rango del torneo
            if (req.body.fecha) {
                const fechaDentroRango = await PartidoModel.fechaDentroRangoTorneo(
                    req.body.fecha,
                    partidoExiste.torneo_id
                );

                if (!fechaDentroRango) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha del partido debe estar dentro del rango del torneo',
                        detalle: {
                            fecha_partido: req.body.fecha,
                            torneo_inicio: partidoExiste.torneo_fecha_inicio,
                            torneo_fin: partidoExiste.torneo_fecha_fin
                        }
                    });
                }
            }

            // Actualizar el partido
            const partidoActualizado = await PartidoModel.update(id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Partido actualizado exitosamente',
                data: partidoActualizado
            });

        } catch (error) {
            console.error('Error al actualizar partido:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar partido',
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

            // Verificar que el partido existe
            const partido = await PartidoModel.findById(id);
            if (!partido) {
                return res.status(404).json({
                    success: false,
                    message: 'Partido no encontrado'
                });
            }

            // Verificar permisos
            const esAdmin = req.usuario.rol_nombre === 'admin';
            const esOrganizadorDelTorneo = partido.torneo_organizador_id === req.usuario.id;

            if (!esAdmin && !esOrganizadorDelTorneo) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este partido'
                });
            }

            // Eliminar el partido
            await PartidoModel.delete(id);

            return res.status(200).json({
                success: true,
                message: 'Partido eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar partido:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar partido',
                error: error.message
            });
        }
    }

    static async obtenerPorTorneo(req, res) {
        try {
            const { torneoId } = req.params;

            if (isNaN(torneoId) || torneoId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de torneo inválido'
                });
            }

            const torneo = await TorneoModel.findById(torneoId);
            if (!torneo) {
                return res.status(404).json({
                    success: false,
                    message: 'Torneo no encontrado'
                });
            }

            const partidos = await PartidoModel.findByTorneo(torneoId);

            return res.status(200).json({
                success: true,
                message: 'Partidos del torneo obtenidos exitosamente',
                data: partidos,
                total: partidos.length,
                torneo: {
                    id: torneo.id,
                    nombre: torneo.nombre,
                    disciplina: torneo.disciplina
                }
            });

        } catch (error) {
            console.error('Error al obtener partidos del torneo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener partidos',
                error: error.message
            });
        }
    }

    static async obtenerPorEquipo(req, res) {
        try {
            const { equipoId } = req.params;

            if (isNaN(equipoId) || equipoId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de equipo inválido'
                });
            }

            const equipo = await EquipoModel.findById(equipoId);
            if (!equipo) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipo no encontrado'
                });
            }

            const partidos = await PartidoModel.findByEquipo(equipoId);

            return res.status(200).json({
                success: true,
                message: 'Partidos del equipo obtenidos exitosamente',
                data: partidos,
                total: partidos.length,
                equipo: {
                    id: equipo.id,
                    nombre: equipo.nombre,
                    torneo: equipo.torneo_nombre
                }
            });

        } catch (error) {
            console.error('Error al obtener partidos del equipo:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener partidos',
                error: error.message
            });
        }
    }

    static async obtenerEventos(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            const partido = await PartidoModel.findById(id);
            if (!partido) {
                return res.status(404).json({
                    success: false,
                    message: 'Partido no encontrado'
                });
            }

            const eventos = await PartidoModel.getEventos(id);

            return res.status(200).json({
                success: true,
                message: 'Eventos del partido obtenidos exitosamente',
                data: eventos,
                total: eventos.length,
                partido: {
                    id: partido.id,
                    local: partido.equipo_local_nombre,
                    visitante: partido.equipo_visitante_nombre,
                    marcador: `${partido.marcador_local} - ${partido.marcador_visitante}`,
                    estado: partido.estado
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

}

module.exports = PartidosController;