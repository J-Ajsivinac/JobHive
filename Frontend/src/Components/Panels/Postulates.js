import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";
import "./JobApplications.css";

// Componente para el gráfico circular
const DonutChart = ({ percentage }) => {
    const data = [
        { name: "Completed", value: percentage },
        { name: "Remaining", value: 100 - percentage },
    ];

    const COLORS = ["#5243F5", "#F5F5F5"];

    return (
        <div className="graph-container">
            <PieChart width={120} height={120}>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={50}
                    startAngle={90}
                    endAngle={450}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                </Pie>
            </PieChart>
            <div className="percentage">{percentage}%</div>
        </div>
    );
};

// Componente principal de postulaciones
const Postulates = () => {
    const [popupVisible, setPopupVisible] = useState(false);
    const [postulates, setPostulates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    // Función para obtener las postulaciones
    const fetchPostulates = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/postulates`,
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
            console.log("Postulaciones obtenidas:", data);
            return data;
        } catch (error) {
            console.error("Error al obtener postulaciones:", error);
            throw error;
        }
    };

    useEffect(() => {
        const loadPostulates = async () => {
            try {
                setLoading(true);
                const data = await fetchPostulates();
                setPostulates(data);
            } catch (err) {
                setError("Error al cargar las postulaciones");
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPostulates();
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

    const getStatusClass = (estado) => {
        switch (estado) {
            case "Pendiente":
                return "status-pending";
            case "En revisión":
                return "status-review";
            case "Rechazado":
                return "status-rejected";
            case "Aceptado":
                return "status-accepted";
            default:
                return "status-pending";
        }
    };

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

    const handleStatusChange = async (postulacionId, nuevoEstado) => {
        setUpdatingStatus(postulacionId);

        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/postulates/${postulacionId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ estado: nuevoEstado }),
                }
            );

            if (!response.ok) {
                throw new Error("Error al actualizar el estado");
            }

            // Actualizar el estado local
            setPostulates(
                postulates.map((p) =>
                    p.POSTULACION_ID === postulacionId
                        ? { ...p, ESTADO: nuevoEstado }
                        : p
                )
            );

            // Mostrar notificación
            setPopupVisible(true);
            setTimeout(() => setPopupVisible(false), 3000);
        } catch (err) {
            console.error("Error al actualizar estado:", err);
            alert("Error al actualizar el estado: " + err.message);
        } finally {
            setUpdatingStatus(null);
        }
    };

    if (loading) {
        return <div className="loading">Cargando postulaciones...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="job-applications">
            <h1>Postulados a los Puestos</h1>
            {postulates.length === 0 ? (
                <p style={{ textAlign: "center", marginTop: "20px" }}>
                    No hay postulaciones disponibles.
                </p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Puesto</th>
                            <th>Postulado</th>
                            <th>Foto</th>
                            <th>CV</th>
                            <th>Salario</th>
                            <th>Fecha de Postulación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {postulates.map((postulate, index) => (
                            <tr key={index}>
                                <td>{postulate.PUESTO}</td>
                                <td>{postulate.POSTULADO}</td>
                                <td>
                                    {postulate.FOTO ? (
                                        <img
                                            src={postulate.FOTO}
                                            alt={postulate.POSTULADO}
                                            style={{
                                                width: "50px",
                                                height: "50px",
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        <span>Sin foto</span>
                                    )}
                                </td>
                                <td>
                                    {postulate.CV ? (
                                        <a
                                            href={postulate.CV}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: "#5243F5",
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Ver CV
                                        </a>
                                    ) : (
                                        <span>Sin CV</span>
                                    )}
                                </td>
                                <td>Q{postulate.SALARIO}</td>
                                <td>{formatDate(postulate.FECHA_CREACION)}</td>
                                <td>
                                    <span
                                        className={`status-badge ${getStatusClass(
                                            postulate.ESTADO
                                        )}`}
                                        style={{
                                            backgroundColor: getStatusStyle(
                                                postulate.ESTADO
                                            ).backgroundColor,
                                            color: getStatusStyle(
                                                postulate.ESTADO
                                            ).color,
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            fontSize: "0.85em",
                                            fontWeight: "600",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            border: `2px solid ${
                                                getStatusStyle(postulate.ESTADO)
                                                    .color
                                            }40`,
                                        }}
                                    >
                                        <span style={{ fontSize: "1.1em" }}>
                                            {
                                                getStatusStyle(postulate.ESTADO)
                                                    .icon
                                            }
                                        </span>
                                        {postulate.ESTADO}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        value={postulate.ESTADO}
                                        onChange={(e) =>
                                            handleStatusChange(
                                                postulate.POSTULACION_ID,
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            updatingStatus ===
                                            postulate.POSTULACION_ID
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "2px solid #5243F5",
                                            backgroundColor: "white",
                                            color: "#5243F5",
                                            fontWeight: "600",
                                            cursor:
                                                updatingStatus ===
                                                postulate.POSTULACION_ID
                                                    ? "wait"
                                                    : "pointer",
                                            fontSize: "0.9em",
                                            transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (
                                                updatingStatus !==
                                                postulate.POSTULACION_ID
                                            ) {
                                                e.target.style.backgroundColor =
                                                    "#f8f9ff";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor =
                                                "white";
                                        }}
                                    >
                                        <option value="Pendiente">
                                            ⏳ Pendiente
                                        </option>
                                        <option value="En revisión">
                                            👁 En revisión
                                        </option>
                                        <option value="Aceptado">
                                            ✓ Aceptado
                                        </option>
                                        <option value="Rechazado">
                                            ✗ Rechazado
                                        </option>
                                    </select>
                                    {updatingStatus ===
                                        postulate.POSTULACION_ID && (
                                        <div
                                            style={{
                                                marginTop: "5px",
                                                fontSize: "0.8em",
                                                color: "#5243F5",
                                            }}
                                        >
                                            Actualizando...
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {popupVisible && (
                <div
                    className="popup-notification"
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        right: "20px",
                        backgroundColor: "#d1e7dd",
                        color: "#0f5132",
                        padding: "15px 25px",
                        borderRadius: "10px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        fontWeight: "600",
                        zIndex: 1000,
                        animation: "slideIn 0.3s ease",
                    }}
                >
                    ✓ ¡Estado actualizado correctamente!
                </div>
            )}
        </div>
    );
};

export default Postulates;
