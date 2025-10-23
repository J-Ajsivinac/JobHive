import React, { useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import './JobApplications.css';

// Componente para el gráfico circular
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

// Componente principal de postulaciones
const Postulates = () => {
    const [popupVisible, setPopupVisible] = useState(false);

    const applications = [
        {
            puesto: 'Senior UX/UI Designer',
            salario: 1500,
            estado: 'Pendiente',
            fecha: '15/09/2024',
        },
        {
            puesto: 'Consultor de Ciberseguridad',
            salario: 1500,
            estado: 'Rechazado',
            fecha: '15/09/2024',
        },
        {
            puesto: 'Junior Python Developer',
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

    return (
        <div className="job-applications">
            <h1>Estado de Postulación</h1>
            <table>
                <thead>
                    <tr>
                        <th>Puesto</th>
                        <th>Salario</th>
                        <th>Estado</th>
                        <th>Fecha de envío</th>
                    </tr>
                </thead>
                <tbody>
                    {applications.map((app, index) => (
                        <tr key={index}>
                            <td>{app.puesto}</td>
                            <td>Q{app.salario}</td>
                            <td>
                                <span className={`status ${getStatusClass(app.estado)}`}>
                                    {app.estado}
                                </span>
                            </td>
                            <td>{app.fecha}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {popupVisible && (
                <div className="popup-notification">
                    ¡Has aceptado el trabajo!
                </div>
            )}
        </div>
    );
};

export default Postulates;
