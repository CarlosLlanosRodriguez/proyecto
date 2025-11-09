const { pool } = require('../config/db');
const bcrypt = require('bcryptjs')

class UsuarioModel {

    static async findByEmail(email) {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.email,
                    u.password_hash,
                    u.telefono,
                    u.activo,
                    u.rol_id,
                    r.nombre as rol_nombre,
                    r.descripcion as rol_descripcion,
                    u.creado_en,
                    u.actualizado_en
                FROM usuarios u
                JOIN roles r ON u.rol_id = r.id
                WHERE u.email = $1
            `;
            const result = await pool.query(query, [email]);
            
            if(result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch(error) {
            throw new Error(`Error al buscar usuario por email: ${error.message}`);
        }
    }

    static async comparePassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch(error) {
            throw new Error(`Error al comparar contraseñas ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const query = `
                SELECT 
                u.id,
                u.nombre,
                u.apellido,
                u.email,
                u.telefono,
                u.activo,
                u.rol_id,
                r.nombre as rol_nombre,
                r.descripcion as rol_descripcion,
                u.creado_en,
                u.actualizado_en
                FROM usuarios u
                JOIN roles r ON u.rol_id = r.id
                WHERE u.id = $1
            `;

            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al buscar usuario por ID: ${error.message}`);
        }
    }

    static async updatePassword(id, newPassword) {
        try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        const query = `
            UPDATE usuarios 
            SET 
            password_hash = $1,
            actualizado_en = NOW()
            WHERE id = $2
        `;

        await pool.query(query, [password_hash, id]);
        return true;
        } catch (error) {
        throw new Error(`Error al actualizar contraseña: ${error.message}`);
        }
    }

    static async findAll() {
        try {
        const query = `
            SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.activo,
            u.rol_id,
            r.nombre as rol_nombre,
            u.creado_en,
            u.actualizado_en
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id ASC
        `;

        const result = await pool.query(query);
        return result.rows;
        } catch (error) {
        throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    static async createUser(userData) {
        const { nombre, apellido, email, password, rol_id, telefono } = userData;

        try {
        // Encriptar la contraseña con bcrypt
        // El número 10 es el "salt rounds" (complejidad del hash)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, telefono)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nombre, apellido, email, rol_id, telefono, activo, creado_en
        `;

        const values = [nombre, apellido, email, password_hash, rol_id, telefono || null];
        const result = await pool.query(query, values);

        return result.rows[0];
        } catch (error) {
        // Si el error es por email duplicado
        if (error.code === '23505') {
            throw new Error('El email ya está registrado');
        }
        throw new Error(`Error al crear usuario: ${error.message}`);
        }
    }

    static async emailExists(email) {
        try {
        const query = `SELECT id FROM usuarios WHERE email = $1`;
        const result = await pool.query(query, [email]);
        return result.rows.length > 0;
        } catch (error) {
        throw new Error(`Error al verificar email: ${error.message}`);
        }
    }

    static async updateUser(id, userData) {
        const { nombre, apellido, email, telefono, rol_id, activo } = userData;
        try {
            const query = `
                UPDATE usuarios 
                SET 
                nombre = COALESCE($1, nombre),
                apellido = COALESCE($2, apellido),
                email = COALESCE($3, email),
                telefono = COALESCE($4, telefono),
                rol_id = COALESCE($5, rol_id),
                activo = COALESCE($6, activo),
                actualizado_en = NOW()
                WHERE id = $7
                RETURNING id, nombre, apellido, email, rol_id, telefono, activo, actualizado_en
            `;

            const values = [nombre, apellido, email, telefono, rol_id, activo, id];
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new Error('El email ya está registrado por otro usuario');
            }
            throw new Error(`Error al actualizar usuario: ${error.message}`);
        }
    }

    static async deleteUser(id) {
        try {
            const query = `
                UPDATE usuarios 
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
            `;

            const result = await pool.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
    }

}

module.exports = UsuarioModel