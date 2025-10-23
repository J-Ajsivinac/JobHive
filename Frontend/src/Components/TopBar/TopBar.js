import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaUser } from 'react-icons/fa';
import { IoMenu, IoClose } from 'react-icons/io5';
import { IoIosLogOut } from "react-icons/io";
import Swal from 'sweetalert2';
import './TopBar.css';
import logo from './UD.png';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ toggleMenu, menuOpen }) => {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditProfile, setIsEditProfile] = useState(false);
    const [profilePicture, setProfilePicture] = useState('/Profile.svg');
    const [selectedFile, setSelectedFile] = useState(null);
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setUser(user);
        if (user && user.picture) {
            setProfilePicture(user.picture);
        }
    }, []);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    const handleViewProfile = () => {
        setIsProfileOpen(true);
    };

    const handleLogout = () => {
        const accessToken = localStorage.getItem('accessToken');
        const idToken = localStorage.getItem('idToken');

        fetch(process.env.REACT_APP_API_URL + '/users/signout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ accessToken }),
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
                localStorage.removeItem('idToken');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                navigate('/'); // Redirigir / "/"
            }
        });
    };

    const closeProfileModal = () => {
        setIsProfileOpen(false);
        setIsEditProfile(false);
    };

    const handleEditClick = () => {
        setIsEditProfile(true);
    };

    const handleProfilePictureChange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicture(reader.result);  // Actualiza la imagen
        };
        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const handlePictureClick = () => {
        fileInputRef.current.click(); // Al hacer clic en la imagen, abre el input file
    };

    const handleSaveChanges = () => {
        console.log('Cambios guardados');
        closeProfileModal();
    };
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };
    const handleClick = () => {
        fileInputRef.current.click(); // Abre el selector de archivos
    };
    const handleDragOver = (event) => {
        event.preventDefault(); // Previene el comportamiento por defecto
    };
    const handleDrop = (event) => {
        event.preventDefault(); // Previene el comportamiento por defecto
        const file = event.dataTransfer.files[0]; // Obtiene el archivo arrastrado
        setSelectedFile(file);
    };
    return (
        <div className='topBar'>
            <div className='topBar-header'>
                <div className='logo'>
                    <img src={logo} alt="Logo" className='logo-img' />
                    <h1>Hire<span>Vision</span></h1>
                </div>
                <div className='menu-icon' onClick={toggleMenu}>
                    {menuOpen ? <IoClose className='io-menu' /> : <IoMenu className='io-menu' />}
                </div>
            </div>
            <div className='bar'>
                <div className='search-bar'>
                    <FaSearch className='search-icon'/>
                    <input className='search' type='text' id='search' name='search' placeholder='Buscar empleos'/>
                </div>
            </div>
            <div className={`user-profile ${dropdownVisible ? 'active' : ''}`} onClick={toggleDropdown}>
                <div className='user-icon'>
                    <img src={profilePicture} alt='User Profile' className='profile-picture-circle'/>
                </div>
                <span className='user-name'>{user ? user.admin == 1 ? user.first_name : `${user.first_name} ${user.last_name}` : 'Usuario'}</span>

                {
                    dropdownVisible && (
                        <div className='panel-profile'>
                            <p className='option' onClick={handleViewProfile}> <FaUser /> Mi perfil</p>
                            <p className='option logout' onClick={handleLogout}> <IoIosLogOut /> Salir</p>
                        </div>
                    )
                }
            </div>

            {isProfileOpen && (
                <div className='edit-profile-modal'>
                    <div className='edit-profile-content'>
                        <h2>{isEditProfile ? 'Editar Perfil' : 'Mi Perfil'}</h2>
                        <button className='close-btn' onClick={closeProfileModal}>X</button>

                        {!isEditProfile ? (
                            <>
                                {/* Sección de visualización del perfil */}
                                <div className='profile-picture'>
                                    <img
                                        src={profilePicture}
                                        alt='Imagen de perfil'
                                        onClick={handlePictureClick}
                                        className='profile-picture-circle'
                                    />
                                    <input
                                        type='file'
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleProfilePictureChange}
                                    />
                                </div>
                                <div>
                                    <p><strong>Nombre:</strong> {user.first_name}</p>
                                </div>
                                <div>
                                    <p><strong>Apellido:</strong> {user.last_name}</p>
                                </div>
                                <div>
                                    <p><strong>Correo Electrónico:</strong> {user.email}</p>
                                </div>
                                <div>
                                    <p><strong>Fecha de Nacimiento:</strong> {user.birth_date.split('T')[0]}</p>
                                </div>
                                <button className='save-btn' onClick={handleEditClick}>Editar</button>
                            </>
                        ) : (
                            <>
                                {/* Sección de edición del perfil */}
                                <div className='profile-picture'>
                                    <img
                                        src={profilePicture} // Mostrar la imagen actualizada
                                        alt='Imagen de perfil'
                                        onClick={handlePictureClick}
                                        className='profile-picture-circle'
                                    />
                                    <input
                                        type='file'
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleProfilePictureChange}
                                    />
                                </div>
                                <form className='columns'>
                                    <div className="form-group">
                                        <input type='text' id='name' name='name' required placeholder=" " value={user.first_name} />
                                        <label htmlFor='name'>Nombre</label>
                                    </div>
                                    <div className="form-group">
                                        <input type='text' id='last-name' name='last-name' required placeholder=" " value={user.last_name} />
                                        <label htmlFor='last-name'>Apellido</label>
                                    </div>
                                    <div className="form-group">
                                        <input type='email' id='email' name='email' required placeholder=" " value={user.email} />
                                        <label htmlFor='email'>Correo Electrónico</label>
                                    </div>
                                    <div className="form-group">
                                        <input type='date' id='birthdate' name='birthdate' required placeholder=" " value={user.birth_date.split('T')[0]} />
                                        <label htmlFor='birthdate'>Fecha de Nacimiento</label>
                                    </div>
                                    <div className="form-group">
                                        <input type='password' id='password' name='password' required placeholder=" " />
                                        <label htmlFor='password'>Nueva Contraseña</label>
                                    </div>
                                    <div className="form-group">
                                        <input type='password' id='confirm-password' name='confirm-password' required placeholder=" " />
                                        <label htmlFor='confirm-password'>Confirmar Contraseña</label>
                                    </div>
                                    <button type='button' className='form-group1' onClick={handleSaveChanges}>Guardar Cambios</button>
                                    <button type='button' className='form-group1' >Enviar CV</button>      
                                </form>
                                <div>
            <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }} // Oculta el input de archivo
            />
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    border: '2px dashed #007bff', 
                    padding: '20px', 
                    borderRadius: '5px', 
                    backgroundColor: '#f8f9fa', 
                    color: '#343a40', 
                    cursor: 'pointer', 
                    textAlign: 'center', 
                    transition: 'background-color 0.3s, border-color 0.3s', 
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e2e6ea';
                    e.currentTarget.style.borderColor = '#0056b3';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'; // Restaura el fondo
                    e.currentTarget.style.borderColor = '#007bff'; // Restaura el borde
                }}
            >
                {selectedFile ? selectedFile.name : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
            </div>
        </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopBar;
