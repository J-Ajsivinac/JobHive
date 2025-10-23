import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import './Confirm.css';

const Confirm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    const [values, setValues] = useState(['', '', '', '', '', '']);
    const inputs = useRef([]);

    const handleChange = (e, index) => {
        const value = e.target.value;

        // Solo acepta un dígito
        if (/^\d$/.test(value)) {
            const newValues = [...values];
            newValues[index] = value;
            setValues(newValues);

            // Mueve el enfoque al siguiente input
            if (index < 5 && value) {
                inputs.current[index + 1].focus();
            }

            if (newValues.join('').length === 6 && newValues[5] !== '') {
                handleSubmit(newValues.join(''));
            }
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            const newValues = [...values];
            if (values[index]) {
                newValues[index] = '';
                setValues(newValues);
            } else if (index > 0) {
                inputs.current[index - 1].focus();
                newValues[index - 1] = '';
                setValues(newValues);
            }
        }
    };

    const handleSubmit = (code) => {
        const payload = {
            email: email,
            code: code,
        };
        console.log(JSON.stringify(payload));

        fetch(process.env.REACT_APP_API_URL + '/users/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.err) {
                if (data.err === 'Too many attempts. Please try again later.') {
                    Swal.fire({
                        title: '¡Error!',
                        text: 'Has superado el número de intentos permitidos. Por favor, espera un momento antes de volver a intentar.',
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                } else {
                    Swal.fire({
                        title: '¡Error!',
                        text: 'Ingrese un código válido',
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                }
                return;
            } else {
                Swal.fire({
                    title: '¡Validación Exitosa!',
                    text: 'Cuenta confirmada exitosamente',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                }).then(() => {
                    navigate('/');
                });
            }
        })
        .catch((err) => {
            alert(`Error: ${err.message}`);
        });
    };

    return (
        <div className='container'>
            <h1 className='title-confirm'>Confirmar Cuenta</h1>
            <p>Ingrese el código de verificación enviado al correo <span className='span-email'>{email}</span></p>
            <form onSubmit={(e) => e.preventDefault()} className='form-confirm'>
                {values.map((value, index) => (
                    <input
                        key={index}
                        type='text'
                        className='code-confirm'
                        value={value}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        ref={el => inputs.current[index] = el}
                        maxLength={1}
                    />
                ))}
            </form>
            <p className='login-signup'>¿No tienes una cuenta? <span className='navigate' onClick={() => navigate('/signup')}>Regístrate aquí</span> o ¿Ya tienes una cuenta? <span className='navigate' onClick={() => navigate('/')}>Inicia Sesión aquí</span></p>
        </div>
    );
};

export default Confirm;
