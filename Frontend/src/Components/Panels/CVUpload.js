import React, { useState } from "react";
import "./CVUpload.css";

const CVUpload = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log("Archivo seleccionado:", file.name, file.type, file.size);

        // Validar tipo de archivo
        const validTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "application/pdf",
        ];
        if (!validTypes.includes(file.type)) {
            setError("Solo se permiten archivos PNG, JPG o PDF");
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("El archivo no debe superar los 5MB");
            return;
        }

        setSelectedFile(file);
        setError(null);
        setSuccess(null);

        // Crear preview para imágenes
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleButtonClick = () => {
        console.log("Botón clickeado, abriendo selector de archivos...");
        document.getElementById("cv-file-input").click();
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Por favor selecciona un archivo");
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            // Convertir archivo a base64
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(selectedFile);
            });

            const token = localStorage.getItem("accessToken");
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = user.id;

            if (!userId) {
                throw new Error("No se encontró el ID del usuario");
            }

            console.log("Subiendo CV...");
            console.log("Token:", token ? "Presente" : "No encontrado");
            console.log("User ID:", userId);
            console.log(
                "URL:",
                `${process.env.REACT_APP_API_URL}/users/upload-cv`
            );

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/users/upload-cv`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        cv: base64Data,
                        userId: userId,
                    }),
                }
            );

            const data = await response.json();
            console.log("Respuesta del servidor:", data);

            if (!response.ok) {
                throw new Error(
                    data.err || data.error || "Error al subir el CV"
                );
            }

            setSuccess("¡CV subido exitosamente!");

            // Actualizar información del usuario en localStorage
            user.cv = data.cvUrl;
            localStorage.setItem("user", JSON.stringify(user));

            // Llamar callback si existe
            if (onUploadSuccess) {
                onUploadSuccess(data);
            }

            // Limpiar formulario después de 1.5 segundos
            setTimeout(() => {
                setSelectedFile(null);
                setPreview(null);
            }, 1500);
        } catch (err) {
            console.error("Error al subir CV:", err);
            setError(err.message || "Error al subir el CV");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="cv-upload-container">
            <h3>Subir Currículum</h3>
            <p className="cv-upload-description">
                Sube tu CV en formato PDF, PNG o JPG (máximo 5MB)
            </p>

            <div className="cv-upload-section">
                <input
                    type="file"
                    id="cv-file-input"
                    accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />

                <button
                    type="button"
                    onClick={handleButtonClick}
                    className="cv-file-label"
                >
                    <span className="cv-file-icon">�</span>
                    <span>
                        {selectedFile
                            ? selectedFile.name
                            : "Haz clic para seleccionar archivo"}
                    </span>
                </button>

                {preview && (
                    <div className="cv-preview">
                        <img src={preview} alt="Preview" />
                    </div>
                )}

                {selectedFile && (
                    <div className="cv-file-info">
                        <p>
                            <strong>Archivo:</strong> {selectedFile.name}
                        </p>
                        <p>
                            <strong>Tamaño:</strong>{" "}
                            {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <p>
                            <strong>Tipo:</strong> {selectedFile.type}
                        </p>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="cv-upload-button"
                >
                    {uploading ? "Subiendo..." : "Subir CV"}
                </button>

                {error && <div className="cv-upload-error">⚠ {error}</div>}

                {success && (
                    <div className="cv-upload-success">✓ {success}</div>
                )}
            </div>
        </div>
    );
};

export default CVUpload;
