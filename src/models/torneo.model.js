const { pool } = require('../config/db');

class TorneoModel {

    static async findAll() {
        try {
            const query = `
            SELECT 
            t.id,
            t.nombre,
            t.disciplina,
            t.temporada,
            t.fecha_inicio,
            t.fecha_fin,
            t.estado,
            t.descripcion,
            t.organizador_id,
            u.nombre || ' ' || u.apellido as organizador_nombre,
            u.email as organizador_email,
            t.creado_en,
            t.actualizado_en,
            (SELECT COUNT(*) FROM equipos e WHERE e.torneo_id = t.id) as total_equipos
            FROM torneos t
            LEFT JOIN usuarios u ON t.organizador_id = u.id
            ORDER BY t.fecha_inicio DESC, t.id DESC
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener torneos: ${error.message}`);
        }
    }

    static async create(torneoData) {
        const {
            nombre,
            disciplina,
            temporada,
            fecha_inicio,
            fecha_fin,
            estado,
            organizador_id,
            descripcion
        } = torneoData;

        try {
            const query = `
                INSERT INTO torneos (
                nombre, 
                disciplina, 
                temporada, 
                fecha_inicio, 
                fecha_fin, 
                estado, 
                organizador_id,
                descripcion
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING 
                id, 
                nombre, 
                disciplina, 
                temporada, 
                fecha_inicio, 
                fecha_fin, 
                estado, 
                organizador_id,
                descripcion,
                creado_en
            `;

            const values = [
                nombre,
                disciplina,
                temporada || null,
                fecha_inicio,
                fecha_fin,
                estado || 'planificado',
                organizador_id,
                descripcion || null
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            // Error de violación de constraint
            if (error.code === '23505') {
                throw new Error('Ya existe un torneo con ese nombre para el mismo organizador');
            }
            throw new Error(`Error al crear torneo: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const query = `
        SELECT 
            t.id,
            t.nombre,
            t.disciplina,
            t.temporada,
            t.fecha_inicio,
            t.fecha_fin,
            t.estado,
            t.descripcion,
            t.organizador_id,
            u.nombre || ' ' || u.apellido as organizador_nombre,
            u.email as organizador_email,
            t.creado_en,
            t.actualizado_en,
            (SELECT COUNT(*) FROM equipos e WHERE e.torneo_id = t.id) as total_equipos,
            (SELECT COUNT(*) FROM partidos p WHERE p.torneo_id = t.id) as total_partidos
        FROM torneos t
        LEFT JOIN usuarios u ON t.organizador_id = u.id
        WHERE t.id = $1
        `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al buscar torneo por ID: ${error.message}`);
        }
    }

    static async update(id, torneoData) {
        const {
            nombre,
            disciplina,
            temporada,
            fecha_inicio,
            fecha_fin,
            estado,
            descripcion
        } = torneoData;

        try {
            const query = `
                UPDATE torneos 
                SET 
                nombre = COALESCE($1, nombre),
                disciplina = COALESCE($2, disciplina),
                temporada = COALESCE($3, temporada),
                fecha_inicio = COALESCE($4, fecha_inicio),
                fecha_fin = COALESCE($5, fecha_fin),
                estado = COALESCE($6, estado),
                descripcion = COALESCE($7, descripcion),
                actualizado_en = NOW()
                WHERE id = $8
                RETURNING 
                id, 
                nombre, 
                disciplina, 
                temporada, 
                fecha_inicio, 
                fecha_fin, 
                estado, 
                organizador_id,
                descripcion,
                actualizado_en
            `;

            const values = [
                nombre,
                disciplina,
                temporada,
                fecha_inicio,
                fecha_fin,
                estado,
                descripcion,
                id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al actualizar torneo: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const query = `DELETE FROM torneos WHERE id = $1`;
            const result = await pool.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar torneo: ${error.message}`);
        }
    }

    static async findByOrganizador(organizador_id) {
        try {
            const query = `
                SELECT 
                t.id,
                t.nombre,
                t.disciplina,
                t.temporada,
                t.fecha_inicio,
                t.fecha_fin,
                t.estado,
                t.descripcion,
                t.organizador_id,
                (SELECT COUNT(*) FROM equipos e WHERE e.torneo_id = t.id) as total_equipos,
                (SELECT COUNT(*) FROM partidos p WHERE p.torneo_id = t.id) as total_partidos,
                t.creado_en,
                t.actualizado_en
                FROM torneos t
                WHERE t.organizador_id = $1
                ORDER BY t.fecha_inicio DESC
            `;

            const result = await pool.query(query, [organizador_id]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener torneos del organizador: ${error.message}`);
        }
    }

    static async findByEstado(estado) {
        try {
            const query = `
                SELECT 
                t.id,
                t.nombre,
                t.disciplina,
                t.temporada,
                t.fecha_inicio,
                t.fecha_fin,
                t.estado,
                t.descripcion,
                t.organizador_id,
                u.nombre || ' ' || u.apellido as organizador_nombre,
                (SELECT COUNT(*) FROM equipos e WHERE e.torneo_id = t.id) as total_equipos
                FROM torneos t
                LEFT JOIN usuarios u ON t.organizador_id = u.id
                WHERE t.estado = $1
                ORDER BY t.fecha_inicio DESC
            `;

            const result = await pool.query(query, [estado]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener torneos por estado: ${error.message}`);
        }
    }

    static async getEquipos(torneoId) {
        try {
            const query = `
                SELECT 
                e.id,
                e.nombre,
                e.color,
                e.representante,
                e.telefono_representante,
                (SELECT COUNT(*) FROM jugadores j WHERE j.equipo_id = e.id) as total_jugadores
                FROM equipos e
                WHERE e.torneo_id = $1
                ORDER BY e.nombre ASC
            `;

            const result = await pool.query(query, [torneoId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener equipos del torneo: ${error.message}`);
        }
    }

}

module.exports = TorneoModel;