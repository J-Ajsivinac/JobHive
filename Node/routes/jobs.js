const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const authenticateJWT = require('../utils/authJWT');
require('dotenv').config();

router.get('/', authenticateJWT, async (req, res) => {
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

router.post('/create', authenticateJWT, async (req, res) => {
    const { puesto, descripcion, salario, skills } = req.body;
    const fechaCreacion = new Date();
    console.log(req.body);

    try {
        const [result] = await db.query('INSERT INTO EMPLEO (PUESTO, DESCRIPCION, SALARIO, FECHA_CREACION) VALUES (?, ?, ?, ?)', [puesto, descripcion, salario, fechaCreacion]);

        const jobId = result.insertId;

        if (skills && Array.isArray(skills)) {
            const skillInsertPromises = skills.map(async (skill) => {
                const [existingSkills] = await db.query('SELECT ID FROM HABILIDAD WHERE NOMBRE = ?', [skill]);
                
                let skillId;
                if (existingSkills.length > 0) {
                    skillId = existingSkills[0].ID;
                } else {
                    const [newSkillResult] = await db.query('INSERT INTO HABILIDAD (NOMBRE) VALUES (?)', [skill]);
                    skillId = newSkillResult.insertId;
                }

                await db.query('INSERT INTO EMPLEO_HABILIDAD (ID_EMPLEO, ID_HABILIDAD) VALUES (?, ?)', [jobId, skillId]);
            });

            await Promise.all(skillInsertPromises);
        }

        res.json({ message: 'Job created!' });
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
    console.log('POST /jobs/create');
});

router.post('/apply', authenticateJWT, async (req, res) => {
    const { userId, jobId } = req.body;
    const fechaAplicacion = new Date();

    try {
        const [existingApplications] = await db.query('SELECT * FROM POSTULACION WHERE ID_USUARIO = ? AND ID_EMPLEO = ?', [userId, jobId]);
        if (existingApplications.length > 0) {
            throw new Error('User already applied to this job');
        }

        const query = 'INSERT INTO POSTULACION (ID_USUARIO, ID_EMPLEO, FECHA_POSTULACION) VALUES (?, ?, ?)';
        await db.query(query, [userId, jobId, fechaAplicacion]);

        res.json({ message: 'Applied to job!' });
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
    console.log('POST /jobs/apply');
});

router.get('/postulates', authenticateJWT, async (req, res) => {
    const query = `
        SELECT 
            E.PUESTO,
            CONCAT(U.NOMBRE, ' ', U.APELLIDO) AS POSTULADO,
            U.FOTO AS FOTO,
            U.CV AS CV,
            E.SALARIO,
            P.FECHA_POSTULACION AS FECHA_CREACION
        FROM 
            POSTULACION P
        JOIN 
            USUARIO U ON P.ID_USUARIO = U.ID
        JOIN 
            EMPLEO E ON P.ID_EMPLEO = E.ID
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
