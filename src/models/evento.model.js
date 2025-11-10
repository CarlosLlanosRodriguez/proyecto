const { pool } = require('../config/db');

class EventoModel {

    static async findAll() {
        try {
            const query = `
            SELECT 
                e.id,
                e.partido_id,
                p.fecha as partido_fecha,
                el.nombre as equipo_local,
                ev.nombre as equipo_visitante,
                e.jugador_id,
                j.nombre || ' ' || j.apellido as jugador_nombre,
                j.nro_camiseta,
                eq.nombre as equipo_jugador,
                e.tipo,
                e.minuto,
                e.descripcion,
                e.creado_en
            FROM eventos_partido e
                INNER JOIN partidos p ON e.partido_id = p.id
                INNER JOIN equipos el ON p.equipo_local_id = el.id
                INNER JOIN equipos ev ON p.equipo_visitante_id = ev.id
                INNER JOIN jugadores j ON e.jugador_id = j.id
                INNER JOIN equipos eq ON j.equipo_id = eq.id
            ORDER BY p.fecha DESC, e.minuto
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener eventos: ${error.message}`);
        }
    }

    static async create(eventoData) {
        const {
            partido_id,
            jugador_id,
            tipo,
            minuto,
            descripcion
        } = eventoData;

        try {
            const query = `
            INSERT INTO eventos_partido (
                partido_id,
                jugador_id,
                tipo,
                minuto,
                descripcion
                )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING 
                id,
                partido_id,
                jugador_id,
                tipo,
                minuto,
                descripcion,
                creado_en
            `;

            const values = [
                partido_id,
                jugador_id,
                tipo,
                minuto,
                descripcion || null
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            // Error de foreign key
            if (error.code === '23503') {
                throw new Error('Partido o jugador especificado no existe');
            }
            // Error de CHECK constraint (tipo)
            if (error.code === '23514' && error.constraint?.includes('tipo')) {
                throw new Error('Tipo de evento inválido');
            }
            // Error de CHECK constraint (minuto)
            if (error.code === '23514' && error.constraint?.includes('minuto')) {
                throw new Error('El minuto debe estar entre 0 y 120');
            }
            throw new Error(`Error al crear evento: ${error.message}`);
        }
    }

    static async jugadorPerteneceAlPartido(jugadorId, partidoId) {
        try {
            const query = `
        SELECT COUNT(*) as cuenta
        FROM jugadores j
        INNER JOIN partidos p ON (j.equipo_id = p.equipo_local_id OR j.equipo_id = p.equipo_visitante_id)
        WHERE j.id = $1 AND p.id = $2
        `;

            const result = await pool.query(query, [jugadorId, partidoId]);
            return parseInt(result.rows[0].cuenta) > 0;
        } catch (error) {
            throw new Error(`Error al verificar jugador del partido: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const query = `
            SELECT 
                e.id,
                e.partido_id,
                p.fecha as partido_fecha,
                p.equipo_local_id,
                el.nombre as equipo_local,
                p.equipo_visitante_id,
                ev.nombre as equipo_visitante,
                t.organizador_id as torneo_organizador_id,
                e.jugador_id,
                j.nombre || ' ' || j.apellido as jugador_nombre,
                j.nro_camiseta,
                j.equipo_id as jugador_equipo_id,
                eq.nombre as equipo_jugador,
                e.tipo,
                e.minuto,
                e.descripcion,
                e.creado_en
            FROM eventos_partido e
            INNER JOIN partidos p ON e.partido_id = p.id
            INNER JOIN equipos el ON p.equipo_local_id = el.id
            INNER JOIN equipos ev ON p.equipo_visitante_id = ev.id
            INNER JOIN torneos t ON p.torneo_id = t.id
            INNER JOIN jugadores j ON e.jugador_id = j.id
            INNER JOIN equipos eq ON j.equipo_id = eq.id
            WHERE e.id = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al buscar evento por ID: ${error.message}`);
        }
    }

    static async update(id, eventoData) {
        const {
            tipo,
            minuto,
            descripcion
        } = eventoData;

        try {
            const query = `
            UPDATE eventos_partido 
                SET 
                tipo = COALESCE($1, tipo),
                minuto = COALESCE($2, minuto),
                descripcion = COALESCE($3, descripcion)
            WHERE id = $4
            RETURNING 
                id,
                partido_id,
                jugador_id,
                tipo,
                minuto,
                descripcion,
                creado_en
            `;

            const values = [tipo, minuto, descripcion, id];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            if (error.code === '23514') {
                throw new Error('Datos inválidos (tipo o minuto)');
            }
            throw new Error(`Error al actualizar evento: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const query = `DELETE FROM eventos_partido WHERE id = $1`;
            const result = await pool.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar evento: ${error.message}`);
        }
    }

    static async findByPartido(partidoId) {
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

    static async getGoleadores(partidoId) {
        try {
            const query = `
            SELECT 
                j.id as jugador_id,
                j.nombre || ' ' || j.apellido as jugador_nombre,
                j.nro_camiseta,
                eq.nombre as equipo_nombre,
                COUNT(*) as goles
            FROM eventos_partido e
            INNER JOIN jugadores j ON e.jugador_id = j.id
            INNER JOIN equipos eq ON j.equipo_id = eq.id
            WHERE e.partido_id = $1 AND e.tipo = 'gol'
            GROUP BY j.id, j.nombre, j.apellido, j.nro_camiseta, eq.nombre
            ORDER BY goles DESC, jugador_nombre
            `;

            const result = await pool.query(query, [partidoId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener goleadores: ${error.message}`);
        }
    }

}

module.exports = EventoModel;