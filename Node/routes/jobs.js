const express = require("express");
const router = express.Router();
const db = require("../utils/db");
const authenticateJWT = require("../utils/authJWT");
require("dotenv").config();

router.get("", authenticateJWT, async (req, res) => {
    const query = `
        SELECT 
            e.ID AS empleo_id,
            e.PUESTO AS puesto,
            e.DESCRIPCION AS descripcion,
            e.SALARIO AS salario,
            e.FECHA_CREACION AS fecha_creacion,
            GROUP_CONCAT(h.NOMBRE) AS habilidades,
            (SELECT COUNT(*) FROM POSTULACION WHERE ID_EMPLEO = e.ID) AS postulados
        FROM 
            EMPLEO e
        JOIN 
            EMPLEO_HABILIDAD eh ON e.ID = eh.ID_EMPLEO
        JOIN 
            HABILIDAD h ON eh.ID_HABILIDAD = h.ID
        GROUP BY 
            e.ID, e.PUESTO, e.DESCRIPCION, e.SALARIO, e.FECHA_CREACION;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/create", authenticateJWT, async (req, res) => {
    const { puesto, descripcion, salario, skills } = req.body;
    const fechaCreacion = new Date();
    console.log(req.body);

    try {
        const [result] = await db.query(
            "INSERT INTO EMPLEO (PUESTO, DESCRIPCION, SALARIO, FECHA_CREACION) VALUES (?, ?, ?, ?)",
            [puesto, descripcion, salario, fechaCreacion]
        );

        const jobId = result.insertId;

        if (skills && Array.isArray(skills)) {
            const skillInsertPromises = skills.map(async (skill) => {
                const [existingSkills] = await db.query(
                    "SELECT ID FROM HABILIDAD WHERE NOMBRE = ?",
                    [skill]
                );

                let skillId;
                if (existingSkills.length > 0) {
                    skillId = existingSkills[0].ID;
                } else {
                    const [newSkillResult] = await db.query(
                        "INSERT INTO HABILIDAD (NOMBRE) VALUES (?)",
                        [skill]
                    );
                    skillId = newSkillResult.insertId;
                }

                await db.query(
                    "INSERT INTO EMPLEO_HABILIDAD (ID_EMPLEO, ID_HABILIDAD) VALUES (?, ?)",
                    [jobId, skillId]
                );
            });

            await Promise.all(skillInsertPromises);
        }

        res.json({ message: "Job created!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: err.message });
    }
    console.log("POST /jobs/create");
});

router.post("/apply", authenticateJWT, async (req, res) => {
    const { userId, jobId } = req.body;
    const fechaAplicacion = new Date();

    try {
        const [existingApplications] = await db.query(
            "SELECT * FROM POSTULACION WHERE ID_USUARIO = ? AND ID_EMPLEO = ?",
            [userId, jobId]
        );
        if (existingApplications.length > 0) {
            throw new Error("User already applied to this job");
        }

        const query =
            "INSERT INTO POSTULACION (ID_USUARIO, ID_EMPLEO, FECHA_POSTULACION) VALUES (?, ?, ?)";
        await db.query(query, [userId, jobId, fechaAplicacion]);

        res.json({ message: "Applied to job!" });
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
    console.log("POST /jobs/apply");
});

router.get("/postulates", authenticateJWT, async (req, res) => {
    const query = `
        SELECT 
            P.ID AS POSTULACION_ID,
            E.ID AS EMPLEO_ID,
            E.PUESTO,
            CONCAT(U.NOMBRE, ' ', U.APELLIDO) AS POSTULADO,
            U.FOTO AS FOTO,
            U.CV AS CV,
            E.SALARIO,
            P.FECHA_POSTULACION AS FECHA_CREACION,
            P.ESTADO
        FROM 
            POSTULACION P
        JOIN 
            USUARIO U ON P.ID_USUARIO = U.ID
        JOIN 
            EMPLEO E ON P.ID_EMPLEO = E.ID
        ORDER BY P.FECHA_POSTULACION DESC
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/my-applications", authenticateJWT, async (req, res) => {
    console.log("JWT completo:", req.user);

    // En el idToken, el email puede estar en 'email' o 'cognito:username'
    const userEmail = req.user.email || req.user["cognito:username"];

    console.log("Email extraído:", userEmail);

    if (!userEmail) {
        return res.status(400).json({
            error: "Email no encontrado en el token",
            tokenData: req.user,
        });
    }

    try {
        const [userResult] = await db.query(
            "SELECT ID FROM USUARIO WHERE CORREO = ?",
            [userEmail]
        );

        if (userResult.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const userId = userResult[0].ID;

        const query = `
            SELECT 
                E.ID AS empleo_id,
                E.PUESTO,
                E.DESCRIPCION,
                E.SALARIO,
                P.FECHA_POSTULACION,
                P.ESTADO,
                GROUP_CONCAT(H.NOMBRE) AS habilidades
            FROM 
                POSTULACION P
            JOIN 
                EMPLEO E ON P.ID_EMPLEO = E.ID
            LEFT JOIN 
                EMPLEO_HABILIDAD EH ON E.ID = EH.ID_EMPLEO
            LEFT JOIN 
                HABILIDAD H ON EH.ID_HABILIDAD = H.ID
            WHERE 
                P.ID_USUARIO = ?
            GROUP BY 
                E.ID, E.PUESTO, E.DESCRIPCION, E.SALARIO, P.FECHA_POSTULACION
            ORDER BY 
                P.FECHA_POSTULACION DESC
        `;

        const [results] = await db.query(query, [userId]);
        console.log("Postulaciones encontradas:", results.length);
        return res.json(results);
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/match-skills", authenticateJWT, async (req, res) => {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({
            message: "Se requiere un array de habilidades",
            matches: [],
        });
    }

    try {
        console.log("=== Inicio de Matching de Habilidades ===");
        console.log("Habilidades del usuario:", skills);

        // Normalizar habilidades del usuario (lowercase, trim)
        const normalizedUserSkills = skills.map((skill) =>
            skill.toLowerCase().trim()
        );

        // Obtener todos los empleos con sus habilidades
        const query = `
            SELECT 
                e.ID AS empleo_id,
                e.PUESTO AS puesto,
                e.DESCRIPCION AS descripcion,
                e.SALARIO AS salario,
                e.FECHA_CREACION AS fecha_creacion,
                GROUP_CONCAT(h.NOMBRE) AS habilidades,
                (SELECT COUNT(*) FROM POSTULACION WHERE ID_EMPLEO = e.ID) AS postulados
            FROM 
                EMPLEO e
            JOIN 
                EMPLEO_HABILIDAD eh ON e.ID = eh.ID_EMPLEO
            JOIN 
                HABILIDAD h ON eh.ID_HABILIDAD = h.ID
            GROUP BY 
                e.ID, e.PUESTO, e.DESCRIPCION, e.SALARIO, e.FECHA_CREACION
        `;

        const [empleos] = await db.query(query);
        console.log(`Total de empleos encontrados: ${empleos.length}`);

        // Calcular matching para cada empleo
        const empleosConMatching = empleos.map((empleo) => {
            const empleoSkills = empleo.habilidades
                ? empleo.habilidades
                      .split(",")
                      .map((h) => h.toLowerCase().trim())
                : [];

            console.log(`\n--- Analizando empleo: ${empleo.puesto} ---`);
            console.log(`Habilidades requeridas:`, empleoSkills);

            // Encontrar coincidencias con múltiples criterios
            const matchingSkills = [];
            const matchedFromUser = new Set();

            normalizedUserSkills.forEach((userSkill) => {
                empleoSkills.forEach((empleoSkill) => {
                    // Comparación exacta
                    if (empleoSkill === userSkill) {
                        if (!matchedFromUser.has(userSkill)) {
                            matchingSkills.push(userSkill);
                            matchedFromUser.add(userSkill);
                            console.log(
                                `✓ Match exacto: "${userSkill}" = "${empleoSkill}"`
                            );
                        }
                    }
                    // Comparación de contención (más flexible)
                    else if (
                        empleoSkill.includes(userSkill) ||
                        userSkill.includes(empleoSkill)
                    ) {
                        if (!matchedFromUser.has(userSkill)) {
                            matchingSkills.push(userSkill);
                            matchedFromUser.add(userSkill);
                            console.log(
                                `✓ Match parcial: "${userSkill}" ~ "${empleoSkill}"`
                            );
                        }
                    }
                });
            });

            console.log(`Total de coincidencias: ${matchingSkills.length}`);

            // Calcular porcentaje de coincidencia
            const matchPercentage =
                empleoSkills.length > 0
                    ? Math.round(
                          (matchingSkills.length / empleoSkills.length) * 100
                      )
                    : 0;

            console.log(`Porcentaje de match: ${matchPercentage}%`);

            return {
                ...empleo,
                habilidades_array: empleo.habilidades
                    ? empleo.habilidades.split(",")
                    : [],
                matching_skills: matchingSkills,
                match_percentage: matchPercentage,
                skills_matched: matchingSkills.length,
                skills_required: empleoSkills.length,
            };
        });

        // Filtrar empleos con al menos 1% de coincidencia y ordenar por porcentaje
        const empleosFiltrados = empleosConMatching
            .filter((empleo) => empleo.match_percentage > 0)
            .sort((a, b) => b.match_percentage - a.match_percentage);

        console.log(`Empleos con coincidencias: ${empleosFiltrados.length}`);

        if (empleosFiltrados.length > 0) {
            console.log("Top 3 coincidencias:");
            empleosFiltrados.slice(0, 3).forEach((empleo, index) => {
                console.log(
                    `${index + 1}. ${empleo.puesto} - ${
                        empleo.match_percentage
                    }%`
                );
            });
        }

        console.log("=== Fin de Matching de Habilidades ===");

        res.json({
            total_matches: empleosFiltrados.length,
            user_skills: skills,
            matches: empleosFiltrados,
        });
    } catch (err) {
        console.error("Error en matching:", err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para actualizar el estado de una postulación (Solo Admin)
router.put("/postulates/:id/status", authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar que el estado sea uno de los valores permitidos
    const estadosPermitidos = [
        "Pendiente",
        "En revisión",
        "Aceptado",
        "Rechazado",
    ];
    if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
            error: "Estado no válido",
            estadosPermitidos,
        });
    }

    try {
        console.log(`Actualizando postulación ${id} a estado: ${estado}`);

        const [result] = await db.query(
            "UPDATE POSTULACION SET ESTADO = ? WHERE ID = ?",
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Postulación no encontrada" });
        }

        res.json({
            message: "Estado actualizado correctamente",
            postulacionId: id,
            nuevoEstado: estado,
        });
    } catch (err) {
        console.error("Error al actualizar estado:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
