import React, { useState, useEffect } from "react";
import CVUpload from "./CVUpload";
import "./UserProfile.css";

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [showCVUpload, setShowCVUpload] = useState(false);

    const loadUserData = () => {
        // Cargar información del usuario desde localStorage
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        console.log("Datos del usuario cargados:", userData);
        setUser(userData);
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const handleUploadSuccess = (data) => {
        console.log("CV subido exitosamente:", data);

        // Actualizar el usuario en localStorage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, cv: data.cvUrl };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Actualizar el estado local
        setUser(updatedUser);

        // Cerrar el modal después de 2 segundos
        setTimeout(() => {
            setShowCVUpload(false);
        }, 2000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "No disponible";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    if (!user) {
        return <div className="loading">Cargando perfil...</div>;
    }

    return (
        <div className="user-profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user.picture ? (
                        <img
                            src={user.picture}
                            alt={`${user.first_name} ${user.last_name}`}
                        />
                    ) : (
                        <div className="avatar-placeholder">
                            {user.first_name ? user.first_name.charAt(0) : "U"}
                            {user.last_name ? user.last_name.charAt(0) : ""}
                        </div>
                    )}
                </div>
                <div className="profile-info">
                    <h2>
                        {user.first_name} {user.last_name}
                    </h2>
                    <p className="profile-email">{user.email}</p>
                    {user.admin === 1 && (
                        <span className="admin-badge">Administrador</span>
                    )}
                </div>
            </div>

            <div className="profile-details">
                <div className="detail-item">
                    <span className="detail-label">Nombre:</span>
                    <span className="detail-value">{user.first_name}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Apellido:</span>
                    <span className="detail-value">{user.last_name}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Correo:</span>
                    <span className="detail-value">{user.email}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Fecha de Nacimiento:</span>
                    <span className="detail-value">
                        {formatDate(user.birth_date)}
                    </span>
                </div>
            </div>

            <div className="cv-section">
                <h3>Currículum Vitae</h3>
                {user.cv ? (
                    <div className="cv-info">
                        <p className="cv-status">✅ CV Subido</p>
                        <a
                            href={user.cv}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cv-view-button"
                        >
                            Ver CV
                        </a>
                        <button
                            onClick={() => setShowCVUpload(true)}
                            className="cv-update-button"
                        >
                            Actualizar CV
                        </button>
                    </div>
                ) : (
                    <div className="cv-info">
                        <p className="cv-status-warning">
                            ⚠️ No has subido tu CV
                        </p>
                        <button
                            onClick={() => setShowCVUpload(true)}
                            className="cv-upload-button-main"
                        >
                            Subir CV
                        </button>
                    </div>
                )}
            </div>

            {showCVUpload && (
                <div className="modal-overlay">
                    <div
                        className="modal-content-cv"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close-btn"
                            onClick={() => setShowCVUpload(false)}
                        >
                            ×
                        </button>
                        <CVUpload onUploadSuccess={handleUploadSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
