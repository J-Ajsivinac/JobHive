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
            case "Rechazado":
                return "status-rejected";
            case "Aceptado":
                return "status-accepted";
            default:
                return "status-pending";
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {popupVisible && (
                <div className="popup-notification">
                    ¡Has aceptado el trabajo!
                </div>
            )}
        </div>
    );
};

export default Postulates;
