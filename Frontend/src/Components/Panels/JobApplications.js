import React, { useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import './JobApplications.css';

const DonutChart = ({ percentage }) => {
    const data = [
        { name: 'Completed', value: percentage },
        { name: 'Remaining', value: 100 - percentage }
    ];

    const COLORS = ['#5243F5', '#F5F5F5'];

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


const JobApplications = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);

    const applications = [
        {
            puesto: 'Senior UX/UI Designer',
            postulado: 'Brandon Tejaxún',
            salario: 1500,
            estado: 'Pendiente',
            fecha: '15/09/2024',
        },
        {
            puesto: 'Consultor de Ciberseguridad',
            postulado: 'Brandon Tejaxún',
            salario: 1500,
            estado: 'Rechazado',
            fecha: '15/09/2024',
        },
        {
            puesto: 'Junior Python Developer',
            postulado: 'Brandon Tejaxún',
            salario: 1500,
            estado: 'Aceptado',
            fecha: '15/09/2024',
        },
    ];

    const getStatusClass = (estado) => {
        switch (estado) {
            case 'Pendiente':
                return 'status-pending';
            case 'Rechazado':
                return 'status-rejected';
            case 'Aceptado':
                return 'status-accepted';
            default:
                return '';
        }
    };

    const openModal = (application) => {
        setSelectedApplication(application);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedApplication(null);
    };

    return (
        <div className="job-applications">
            <h1>Postulados</h1>
            <table>
                <thead>
                    <tr>
                        <th>Puesto</th>
                        <th>Postulado</th>
                        <th>Salario</th>
                        <th>Estado</th>
                        <th>Fecha de envío</th>
                        <th>Perfil</th>
                    </tr>
                </thead>
                <tbody>
                    {applications.map((app, index) => (
                        <tr key={index}>
                            <td>{app.puesto}</td>
                            <td>{app.postulado}</td>
                            <td>Q{app.salario}</td>
                            <td>
                                <span className={`status ${getStatusClass(app.estado)}`}>
                                    {app.estado}
                                </span>
                            </td>
                            <td>{app.fecha}</td>
                            <td>
                                <a onClick={() => openModal(app)}>Ver Perfil</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && selectedApplication && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>
                            &times;
                        </span>
                        <div className="profile-cv">
                            <div className="profile-section">
                                <img
                                    src="./Profile.svg"
                                    alt="Profile"
                                    className="profile-image-cv"
                                />
                                <div class="graph-container">
                                    <DonutChart percentage={25} />
                                    <div class="percentage">25%</div>
                                </div>
                            </div>
                            <h2>{selectedApplication.postulado}</h2>
                            <div className="skills">
                                <span>Python</span>
                                <span>JavaScript</span>
                                <span>MySQL</span>
                                <span>Docker</span>
                            </div>
                            <div className="download-section">
                                <select className="format-select">
                                    <option value="Pendiente" selected="true" disabled>Pendiente</option>
                                    <option value="Aceptado">Aceptado</option>
                                    <option value="Rechazado">Rechazado</option>
                                </select>
                                <button className="download-cv">
                                    Descargar CV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobApplications;
