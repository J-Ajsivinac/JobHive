import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        if (!email || !password) {
            Swal.fire({
                title: '¡Error!',
                text: 'Por favor, llena todos los campos',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
            return;
        }

        fetch(process.env.REACT_APP_API_URL + '/users/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
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
                localStorage.setItem('idToken', data.idToken);
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                data.user.admin == 1 ? navigate('/admin') : navigate('/user');
            }
        })

        // // Verifica si es el admin
        // if (email === 'admin@hirevision.com' && password === 'admin') {
        //     // Almacena la información del usuario en localStorage
        //     localStorage.setItem('user', JSON.stringify({ email, role: 'admin' }));
        //     navigate('/admin');
        // } else {
        //     // Almacena la información del usuario común
        //     localStorage.setItem('user', JSON.stringify({ email, role: 'user' }));
        //     navigate('/user');
        // }
    };

    return (
        <div className='container'>
            <h1>Inicia Sesión</h1>
            <form onSubmit={handleLogin}>
                <div className="form-group1">
                    <input 
                        type='email' 
                        id='email' 
                        name='email' 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        placeholder=" " 
                    />
                    <label htmlFor='email'>Correo Electrónico</label>
                </div>
                <div className="form-group1">
                    <input 
                        type='password' 
                        id='password' 
                        name='password' 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        placeholder=" " 
                    />
                    <label htmlFor='password'>Contraseña</label>
                </div>
                <button type='submit'>Iniciar Sesión</button>
            </form>
            <p className='login-signup'>¿No tienes una cuenta? <span className='navigate' onClick={() => navigate('/signup')}>Regístrate aquí</span></p>
        </div>
    );
};

export default Login;
