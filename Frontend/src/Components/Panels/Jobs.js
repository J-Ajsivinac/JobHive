import React, { useState, useEffect } from 'react';
import './Jobs.css';
import JobForm from './JobForm';

const JobDetailsModal = ({ job, onClose }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close-btn" onClick={onClose}>&times;</span>
                <h2 className="title-modal">Detalles del Puesto</h2>
                <h3>{job.puesto}</h3>
                <p><strong>Salario:</strong> {job.salario} Q/mes</p>
                <p><strong>Fecha de Creación:</strong> {job.fecha_creacion}</p>
                <p><strong>Habilidades:</strong> {job.habilidades}</p>
                <p><strong>Descripción:</strong> {job.descripcion}</p>
            </div>
        </div>
    );
};

const Jobs = () => {
    const [jobs, setJobs] = useState([]);
    const [showJobModal, setShowJobModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    const fetchJobs = async () => {
        try {
            const response = await fetch(process.env.REACT_APP_API_URL + '/admin/jobs');
            const data = await response.json();
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleNewJobClick = () => {
        setShowJobModal(true);
    };

    const handleCloseJobModal = () => {
        setShowJobModal(false);
        window.location.reload();
    };

    const handleDetailsClick = (job) => {
        setSelectedJob(job);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedJob(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="jobs-container">
            <div className="jobs-header">
                <button className="btn btn-new-job" onClick={handleNewJobClick}>
                    Nuevo Puesto
                </button>
            </div>

            <div className="jobs-grid">
                {jobs.length > 0 ? (
                    jobs.map((job) => (
                        <div key={job.empleo_id} className="job-card">
                            <div className="job-card-header">
                                <span className="job-date">{formatDate(job.fecha_creacion)}</span>
                            </div>
                            <h2 className="job-title">{job.puesto}</h2>
                            <div className="job-skills">
                                {job.habilidades
                                    .split(',')
                                    .slice(0, 5)
                                    .map((skill, index) => (
                                        <span key={index} className="job-skill-tag">
                                            {skill}
                                        </span>
                                    ))}
                            </div>
                            <div className="job-footer">
                                <span className="job-salary">{job.salario} Q/mes</span>
                                <button className="btn btn-primary" onClick={() => handleDetailsClick(job)}>
                                    Detalles
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No hay empleos disponibles.</p>
                )}
            </div>

            {showJobModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-btn" onClick={handleCloseJobModal}>&times;</span>
                        <h2 className="title-modal">Nuevo Puesto</h2>
                        <JobForm handleCloseModal={handleCloseJobModal} />
                    </div>
                </div>
            )}

            {showDetailsModal && selectedJob && (
                <JobDetailsModal job={selectedJob} onClose={handleCloseDetailsModal} />
            )}
        </div>
    );
};

export default Jobs;
