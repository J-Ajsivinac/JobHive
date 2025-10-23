import React, { useState } from 'react';
import './Jobs.css';
import ResumeForm from './ResumeForm';

const GetJob = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null); // Nuevo estado para el trabajo seleccionado

    const jobs = Array.from({ length: 4 }, (_, index) => ({
        id: index + 1,
        title: `Trabajo ${index + 1}`,
        description: `Descripción del trabajo ${index + 1}. Este es un trabajo de prueba para el panel de empleos y comprobar qué tanto`,
        date: '20 Sep, 2024',
        salary: '1000 USD/mes',
        skills: ['Figma', 'Adobe XD', 'React', 'Node.js',,],
    }));

    const handleNewJobClick = (job) => {
        setSelectedJob(job); // Guardar el trabajo seleccionado
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedJob(null); // Limpiar el trabajo seleccionado al cerrar
    };

    return (
        <div className="jobs-container">
            <div className="jobs-grid">
                {jobs.map((job) => (
                    <div key={job.id} className="job-card">
                        <div className="job-card-header">
                            <span className="job-date">{job.date}</span>
                        </div>
                        <h2 className="job-title">{job.title}</h2>
                        <p className="job-description">{job.description}</p>
                        <div className="job-skills">
                            {job.skills.map((skill, index) => (
                                <span key={index} className="job-skill-tag">
                                    {skill}
                                </span>
                            ))}
                        </div>
                        <div className="job-footer">
                            <span className="job-salary">{job.salary}</span>
                            <button className="btn btn-primary" onClick={() => handleNewJobClick(job)}>Detalles</button>
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
                        <h2 className='title-modal'>Detalles del Trabajo</h2>
                        <ResumeForm job={selectedJob} /> {/* Pasar el trabajo seleccionado */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GetJob;
