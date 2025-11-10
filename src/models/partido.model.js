const { pool } = require('../config/db');

class PartidoModel {

    static async findAll() {
        try {
            const query = `
                SELECT 
                p.id,
                p.torneo_id,
                t.nombre as torneo_nombre,
                t.disciplina as torneo_disciplina,
                p.equipo_local_id,
                el.nombre as equipo_local_nombre,
                el.color as equipo_local_color,
                p.equipo_visitante_id,
                ev.nombre as equipo_visitante_nombre,
                ev.color as equipo_visitante_color,
                p.fecha,
                p.lugar,
                p.marcador_local,
                p.marcador_visitante,
                p.estado,
                p.observaciones,
                p.creado_en,
                p.actualizado_en,
                (SELECT COUNT(*) FROM eventos_partido e WHERE e.partido_id = p.id) as total_eventos
                FROM partidos p
                INNER JOIN torneos t ON p.torneo_id = t.id
                INNER JOIN equipos el ON p.equipo_local_id = el.id
                INNER JOIN equipos ev ON p.equipo_visitante_id = ev.id
                ORDER BY p.fecha DESC, p.id DESC
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener partidos: ${error.message}`);
        }
    }

    static async equiposPerteneceAlTorneo(equipoLocalId, equipoVisitanteId, torneoId) {
        try {
            const query = `
            SELECT COUNT(*) as cuenta
            FROM equipos
            WHERE torneo_id = $1 
            AND id IN ($2, $3)
            `;

            const result = await pool.query(query, [torneoId, equipoLocalId, equipoVisitanteId]);
            return parseInt(result.rows[0].cuenta) === 2;
        } catch (error) {
            throw new Error(`Error al verificar equipos del torneo: ${error.message}`);
        }
    }

    static async fechaDentroRangoTorneo(fechaPartido, torneoId) {
        try {
            const query = `
                SELECT 
                fecha_inicio,
                fecha_fin
                FROM torneos
                WHERE id = $1
            `;

            const result = await pool.query(query, [torneoId]);

            if (result.rows.length === 0) {
                return false;
            }

            const { fecha_inicio, fecha_fin } = result.rows[0];
            const fechaP = new Date(fechaPartido);
            const fechaI = new Date(fecha_inicio);
            const fechaF = new Date(fecha_fin);

            // Extraer solo la fecha (sin hora)
            fechaP.setHours(0, 0, 0, 0);
            fechaI.setHours(0, 0, 0, 0);
            fechaF.setHours(0, 0, 0, 0);

            return fechaP >= fechaI && fechaP <= fechaF;
        } catch (error) {
            throw new Error(`Error al verificar fecha del torneo: ${error.message}`);
        }
    }

    static async create(partidoData) {
        const {
            torneo_id,
            equipo_local_id,
            equipo_visitante_id,
            fecha,
            lugar,
            estado,
            observaciones
        } = partidoData;

        try {
            const query = `
                INSERT INTO partidos (
                    torneo_id,
                    equipo_local_id,
                    equipo_visitante_id,
                    fecha,
                    lugar,
                    estado,
                    observaciones
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING 
                    id,
                    torneo_id,
                    equipo_local_id,
                    equipo_visitante_id,
                    fecha,
                    lugar,
                    marcador_local,
                    marcador_visitante,
                    estado,
                    observaciones,
                    creado_en
            `;

            const values = [
                torneo_id,
                equipo_local_id,
                equipo_visitante_id,
                fecha,
                lugar || null,
                estado || 'pendiente',
                observaciones || null
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            // Error de foreign key
            if (error.code === '23503') {
                throw new Error('Torneo o equipo especificado no existe');
            }
            // Error de CHECK constraint (equipos diferentes)
            if (error.code === '23514') {
                throw new Error('Un equipo no puede jugar contra sí mismo');
            }
            throw new Error(`Error al crear partido: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const query = `
            SELECT 
                p.id,
                p.torneo_id,
                t.nombre as torneo_nombre,
                t.disciplina as torneo_disciplina,
                t.fecha_inicio as torneo_fecha_inicio,
                t.fecha_fin as torneo_fecha_fin,
                t.organizador_id as torneo_organizador_id,
                p.equipo_local_id,
                el.nombre as equipo_local_nombre,
                el.color as equipo_local_color,
                p.equipo_visitante_id,
                ev.nombre as equipo_visitante_nombre,
                ev.color as equipo_visitante_color,
                p.fecha,
                p.lugar,
                p.marcador_local,
                p.marcador_visitante,
                p.estado,
                p.observaciones,
                p.creado_en,
                p.actualizado_en,
                (SELECT COUNT(*) FROM eventos_partido e WHERE e.partido_id = p.id) as total_eventos
            FROM partidos p
                INNER JOIN torneos t ON p.torneo_id = t.id
                INNER JOIN equipos el ON p.equipo_local_id = el.id
                INNER JOIN equipos ev ON p.equipo_visitante_id = ev.id
                WHERE p.id = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al buscar partido por ID: ${error.message}`);
        }
    }

    static async update(id, partidoData) {
        const {
            fecha,
            lugar,
            marcador_local,
            marcador_visitante,
            estado,
            observaciones
        } = partidoData;

        try {
            const query = `
            UPDATE partidos 
            SET 
                fecha = COALESCE($1, fecha),
                lugar = COALESCE($2, lugar),
                marcador_local = COALESCE($3, marcador_local),
                marcador_visitante = COALESCE($4, marcador_visitante),
                estado = COALESCE($5, estado),
                observaciones = COALESCE($6, observaciones),
                actualizado_en = NOW()
            WHERE id = $7
            RETURNING 
                id,
                torneo_id,
                equipo_local_id,
                equipo_visitante_id,
                fecha,
                lugar,
                marcador_local,
                marcador_visitante,
                estado,
                observaciones,
                actualizado_en
            `;

            const values = [
                fecha,
                lugar,
                marcador_local,
                marcador_visitante,
                estado,
                observaciones,
                id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al actualizar partido: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const query = `DELETE FROM partidos WHERE id = $1`;
            const result = await pool.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar partido: ${error.message}`);
        }
    }

    static async findByTorneo(torneoId) {
        try {
            const query = `
            SELECT 
                p.id,
                p.equipo_local_id,
                el.nombre as equipo_local_nombre,
                p.equipo_visitante_id,
                ev.nombre as equipo_visitante_nombre,
                p.fecha,
                p.lugar,
                p.marcador_local,
                p.marcador_visitante,
                p.estado,
                p.observaciones,
                p.creado_en,
                p.actualizado_en
            FROM partidos p
                INNER JOIN equipos el ON p.equipo_local_id = el.id
                INNER JOIN equipos ev ON p.equipo_visitante_id = ev.id
            WHERE p.torneo_id = $1
            ORDER BY p.fecha, p.id
            `;

            const result = await pool.query(query, [torneoId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener partidos del torneo: ${error.message}`);
        }
    }

    static async findByEquipo(equipoId) {
        try {
            const query = `
            SELECT 
                p.id,
                p.torneo_id,
                t.nombre as torneo_nombre,
                p.equipo_local_id,
                el.nombre as equipo_local_nombre,
                p.equipo_visitante_id,
                ev.nombre as equipo_visitante_nombre,
                p.fecha,
                p.lugar,
                p.marcador_local,
                p.marcador_visitante,
                p.estado,
                CASE 
                    WHEN p.equipo_local_id = $1 THEN 'local'
                    ELSE 'visitante'
                END as tipo_participacion
            FROM partidos p
                INNER JOIN torneos t ON p.torneo_id = t.id
                INNER JOIN equipos el ON p.equipo_local_id = el.id
                INNER JOIN equipos ev ON p.equipo_visitante_id = ev.id
            WHERE p.equipo_local_id = $1 OR p.equipo_visitante_id = $1
            ORDER BY p.fecha DESC
            `;

            const result = await pool.query(query, [equipoId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener partidos del equipo: ${error.message}`);
        }
    }

    static async getEventos(partidoId) {
        try {
            const query = `
            SELECT
                e.id,
                e.partido_id,
                e.jugador_id,
                j.nombre || ' ' || j.apellido as jugador_nombre,
                j.nro_camiseta,
                eq.nombre as equipo_nombre,
                e.tipo,
                e.minuto,
                e.descripcion,
                e.creado_en
            FROM eventos_partido e
                INNER JOIN jugadores j ON e.jugador_id = j.id
                INNER JOIN equipos eq ON j.equipo_id = eq.id
            WHERE e.partido_id = $1
            ORDER BY e.minuto, e.id
            `;

            const result = await pool.query(query, [partidoId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener eventos del partido: ${error.message}`);
        }
    }

}

module.exports = PartidoModel;