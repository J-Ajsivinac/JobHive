import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ResumeForm = ({ job }) => {
    const [translatedTitle, setTranslatedTitle] = useState(''); // Estado para manejar el título traducido

    if (!job) return null; // Si no hay trabajo seleccionado, no mostrar nada

    const handlePlayClick = () => {
        // Lógica para reproducir la descripción o leerla en voz alta
        console.log("Reproduciendo la descripción del puesto...");
    };

    const handleTranslateChange = (e) => {
        const selectedLanguage = e.target.value;
        // Lógica para traducir la descripción a otro idioma
        console.log("Traducir a:", selectedLanguage);


        if (selectedLanguage === 'es') {
            setTranslatedTitle('Título del Puesto en Español');
        } else if (selectedLanguage === 'en') {
            setTranslatedTitle('Job Title in English');
        } else if (selectedLanguage === 'fr') {
            setTranslatedTitle('Titre du poste en français');
        } else if (selectedLanguage === 'de') {
            setTranslatedTitle('Stellentitel auf Deutsch');
        }
    };

    return (
        <form className="job-form" style={{ maxHeight: '500px', overflowY: 'scroll' }}>
            <div className="form-header">
                <h2>{job.title}</h2>
                <p className="salary-info"><strong>Salario: </strong>{job.salary}</p>
            </div>

            <div className="form-group1">
                <p className="job-info"><strong>Fecha de Publicación: </strong>{job.date}</p>
            </div>

            <div className="form-group1">
                <div className="skills-input-container">
                    <p className="skills-title"><strong>Habilidades:</strong></p>
                    <div className="chips-container">
                        {job.skills.map((skill, index) => (
                            <span key={index} className="chip">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="form-group1">
                <p><strong>Descripción del puesto:</strong></p>
                <ReactQuill 
                    value={job.description} 
                    readOnly={true} 
                    theme="bubble" 
                    style={{ maxHeight: '200px', overflowY: 'auto' }} // Limita el tamaño del editor con barra de desplazamiento
                />
                <div style={{ marginTop: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ marginRight: '10px' }}>Escuchar</span>
                    <button 
                        onClick={handlePlayClick} 
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontSize: '16px',
                            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                            transition: 'background-color 0.3s ease',
                            marginRight: '20px' // Espacio entre botón y translate
                        }}
                    >
                        ▷
                    </button>

                    <span style={{ marginRight: '10px' }}>Translate:</span>
                    <select onChange={handleTranslateChange} style={{ padding: '5px', borderRadius: '5px' }}>
                        <option value="es">Español</option>
                        <option value="en">Inglés</option>
                        <option value="fr">Francés</option>
                        <option value="de">Alemán</option>
                    </select>
                </div>
            </div>

            {/* Título traducido del puesto */}
            <div className="form-group1" style={{ marginTop: '20px' }}>
                <p><strong>Título del Puesto Traducido:</strong></p>
                <ReactQuill 
                    value={translatedTitle} 
                    readOnly={true} 
                    theme="bubble" 
                    style={{ maxHeight: '100px', overflowY: 'auto' }} // Limita el tamaño del editor con barra de desplazamiento
                />
            </div>
        </form>
    );
};

export default ResumeForm;
