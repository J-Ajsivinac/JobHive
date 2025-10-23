import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import Swal from 'sweetalert2';
import 'react-quill/dist/quill.snow.css';
import './JobForm.css';

const JobForm = ({ handleCloseModal }) => {
    const [description, setDescription] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState([]);
    const [puesto, setPuesto] = useState('');
    const [salario, setSalario] = useState('');

    const handleDescriptionChange = (value) => {
        setDescription(value);
    };

    const handleSkillChange = (e) => {
        setSkillInput(e.target.value);
    };

    const handleKeyDown = (e) => {
        // Detectar Ctrl + Enter
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            if (skillInput.trim() !== '') {
                setSkills([...skills, skillInput.trim()]);
                setSkillInput(''); // Limpiar el input
            }
        }
    };

    const removeSkill = (index) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!puesto || !salario || !description || skills.length === 0) {
            Swal.fire({
                title: '¡Error!',
                text: 'Por favor, llena todos los campos',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
            return;
        }

        fetch(process.env.REACT_APP_API_URL + '/admin/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                puesto: puesto,
                descripcion: description,
                salario: salario,
                skills: skills
            })
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.err) {
                Swal.fire({
                    title: '¡Error!',
                    text: data.err,
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            } else {
                Swal.fire({
                    title: '¡Éxito!',
                    text: "Puesto creado",
                    icon: 'success',
                    confirmButtonText: 'Ok'
                }).then(() => {
                    handleCloseModal();
                });
            }
        })
        .catch((err) => {
            Swal.fire({
                title: '¡Error!',
                text: err.message,
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        });
    };

    return (
        <form className="job-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group1">
                    <input 
                        type="text" 
                        id="title" 
                        required 
                        placeholder=" " 
                        value={puesto} 
                        onChange={(e) => setPuesto(e.target.value)} 
                    />
                    <label htmlFor="title">Título del puesto</label>
                </div>
                <div className="form-group1">
                    <input 
                        type="number" 
                        id="salary" 
                        required 
                        placeholder=" " 
                        value={salario} 
                        onChange={(e) => setSalario(e.target.value)} 
                    />
                    <label htmlFor="salary">Salario</label>
                </div>
            </div>
            <div className="form-group1">
                <div className="skills-input-container">
                    <div className="input-chip-container">
                        <div className="chips-container">
                            {skills.map((skill, index) => (
                                <div key={index} className="chip">
                                    {skill}
                                    <button
                                        type="button"
                                        className="chip-close"
                                        onClick={() => removeSkill(index)}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <input
                                type="text"
                                value={skillInput}
                                onChange={handleSkillChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe una habilidad y presiona Ctrl + Enter"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-group1">
                <ReactQuill 
                    value={description} 
                    onChange={handleDescriptionChange} 
                    placeholder="Escribe la descripción del puesto..." 
                />
            </div>

            <button type="submit">Crear Puesto</button>
        </form>
    );
};

export default JobForm;
