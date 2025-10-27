import React, { useState, useEffect } from "react";
import "./JobApplications.css";

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para obtener mis postulaciones
    const fetchMyApplications = async () => {
        try {
            const token = localStorage.getItem("idToken"); // Cambiar a idToken
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/my-applications`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log("Mis postulaciones:", data);
            return data;
        } catch (error) {
            console.error("Error al obtener mis postulaciones:", error);
            throw error;
        }
    };

    useEffect(() => {
        const loadApplications = async () => {
            try {
                setLoading(true);
                const data = await fetchMyApplications();
                setApplications(data);
            } catch (err) {
                setError("Error al cargar tus postulaciones");
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

    // Función para formatear la fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Función para procesar las habilidades
    const processSkills = (skillsString) => {
        if (!skillsString) return [];
        return skillsString.split(",").map((skill) => skill.trim());
    };

    // Función para obtener el estilo del estado
    const getStatusStyle = (estado) => {
        const styles = {
            Pendiente: {
                backgroundColor: "#fff3cd",
                color: "#856404",
                icon: "⏳",
            },
            "En revisión": {
                backgroundColor: "#cfe2ff",
                color: "#084298",
                icon: "👁",
            },
            Aceptado: {
                backgroundColor: "#d1e7dd",
                color: "#0f5132",
                icon: "✓",
            },
            Rechazado: {
                backgroundColor: "#f8d7da",
                color: "#842029",
                icon: "✗",
            },
        };
        return styles[estado] || styles["Pendiente"];
    };

    if (loading) {
        return <div className="loading">Cargando tus postulaciones...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="job-applications">
            <h1>Mis Postulaciones</h1>
            {applications.length === 0 ? (
                <p style={{ textAlign: "center", marginTop: "20px" }}>
                    No tienes postulaciones aún. ¡Explora los trabajos
                    disponibles!
                </p>
            ) : (
                <div
                    className="applications-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "20px",
                        padding: "20px",
                    }}
                >
                    {applications.map((app, index) => (
                        <div
                            key={index}
                            className="application-card"
                            style={{
                                border: "1px solid #e0e0e0",
                                borderRadius: "12px",
                                padding: "20px",
                                backgroundColor: "white",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#5243F5",
                                    marginBottom: "10px",
                                    fontSize: "1.2em",
                                }}
                            >
                                {app.PUESTO}
                            </h3>

                            <div style={{ marginBottom: "15px" }}>
                                <p
                                    style={{
                                        fontSize: "1.1em",
                                        fontWeight: "bold",
                                        color: "#2c3e50",
                                    }}
                                >
                                    Salario: Q{app.SALARIO}/mes
                                </p>
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <p
                                    style={{
                                        fontSize: "0.9em",
                                        color: "#7f8c8d",
                                    }}
                                >
                                    <strong>Fecha de Postulación:</strong>{" "}
                                    {formatDate(app.FECHA_POSTULACION)}
                                </p>
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <p
                                    style={{
                                        fontSize: "0.9em",
                                        fontWeight: "bold",
                                        marginBottom: "8px",
                                    }}
                                >
                                    Habilidades requeridas:
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                    }}
                                >
                                    {processSkills(app.habilidades).map(
                                        (skill, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    backgroundColor: "#e8f4f8",
                                                    color: "#5243F5",
                                                    padding: "4px 12px",
                                                    borderRadius: "20px",
                                                    fontSize: "0.85em",
                                                    fontWeight: "500",
                                                }}
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>

                            <div
                                style={{
                                    marginTop: "15px",
                                    padding: "12px",
                                    backgroundColor: getStatusStyle(app.ESTADO)
                                        .backgroundColor,
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    border: `2px solid ${
                                        getStatusStyle(app.ESTADO).color
                                    }20`,
                                }}
                            >
                                <span
                                    style={{
                                        color: getStatusStyle(app.ESTADO).color,
                                        fontWeight: "bold",
                                        fontSize: "0.95em",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span style={{ fontSize: "1.2em" }}>
                                        {getStatusStyle(app.ESTADO).icon}
                                    </span>
                                    Estado: {app.ESTADO}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyApplications;
