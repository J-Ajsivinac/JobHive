import React, { useState, useEffect } from "react";
import "./Jobs.css";
import ResumeForm from "./ResumeForm";

const GetJob = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(
                process.env.REACT_APP_API_URL + "/jobs",
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
            console.log("Fetched jobs:", data);
            return data;
        } catch (error) {
            console.error("Error fetching jobs:", error);
            throw error;
        }
    };

    useEffect(() => {
        const loadJobs = async () => {
            try {
                setLoading(true);
                const data = await fetchJobs();
                setJobs(data);
            } catch (err) {
                setError("Error al cargar los trabajos");
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadJobs();
    }, []);

    // Función para formatear la fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Función para formatear el salario
    const formatSalary = (salary) => {
        return `$${salary} USD/mes`;
    };

    // Función para procesar las habilidades
    const processSkills = (skillsString) => {
        if (!skillsString) return [];
        return skillsString.split(",").map((skill) => skill.trim());
    };

    // Función para extraer texto limpio de la descripción HTML
    const getCleanDescription = (htmlDescription) => {
        if (!htmlDescription) return "";
        // Remover etiquetas HTML y limitar longitud
        const cleanText = htmlDescription.replace(/<[^>]*>/g, "");
        return cleanText.length > 150
            ? cleanText.substring(0, 150) + "..."
            : cleanText;
    };

    const handleNewJobClick = (job) => {
        setSelectedJob(job);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedJob(null);
    };

    if (loading) {
        return <div className="loading">Cargando trabajos...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="jobs-container">
            <div className="jobs-grid">
                {jobs.map((job) => (
                    <div key={job.empleo_id || job.id} className="job-card">
                        <div className="job-card-header">
                            <span className="job-date">
                                {formatDate(job.fecha_creacion)}
                            </span>
                        </div>
                        <h2 className="job-title">{job.puesto}</h2>
                        <p className="job-description">
                            {getCleanDescription(job.descripcion)}
                        </p>
                        <div className="job-skills">
                            {processSkills(job.habilidades).map(
                                (skill, index) => (
                                    <span key={index} className="job-skill-tag">
                                        {skill}
                                    </span>
                                )
                            )}
                        </div>
                        <div className="job-footer">
                            <span className="job-salary">
                                {formatSalary(job.salario)}
                            </span>
                            <div className="job-postulants">
                                Postulados: {job.postulados || 0}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleNewJobClick(job)}
                            >
                                Detalles
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && selectedJob && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-btn" onClick={handleCloseModal}>
                            &times;
                        </span>
                        <h2 className="title-modal">Detalles del Trabajo</h2>
                        <ResumeForm
                            job={selectedJob}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GetJob;
