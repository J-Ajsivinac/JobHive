import React, { useState, useEffect } from "react";
import "./ImageAnalyzer.css";

const ImageAnalyzer = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [user, setUser] = useState(null);
    const [mode, setMode] = useState("manual"); // "manual" o "auto"
    const [jobMatches, setJobMatches] = useState(null);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobDetails, setShowJobDetails] = useState(false);
    const [applyingToJob, setApplyingToJob] = useState(null);

    useEffect(() => {
        // Cargar información del usuario
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
    }, []);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log("Imagen seleccionada:", file.name, file.type, file.size);

        // Validar tipo de archivo (solo imágenes)
        const validTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            setError("Solo se permiten archivos PNG o JPG");
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("El archivo no debe superar los 5MB");
            return;
        }

        setSelectedImage(file);
        setError(null);
        setResults(null);

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleButtonClick = () => {
        console.log("Botón clickeado, abriendo selector de archivos...");
        document.getElementById("image-file-input").click();
    };

    const handleAnalyze = async () => {
        if (!selectedImage) {
            setError("Por favor selecciona una imagen primero");
            return;
        }

        setAnalyzing(true);
        setError(null);
        setResults(null);
        setJobMatches(null); // Reset job matches
        setLoadingMatches(false); // Reset loading state

        try {
            // Convertir archivo a base64
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(selectedImage);
            });

            const token = localStorage.getItem("accessToken");

            if (!token) {
                throw new Error(
                    "No hay sesión activa. Por favor inicia sesión."
                );
            }

            console.log("Analizando imagen...");
            console.log("Token:", token ? "Presente" : "No encontrado");
            console.log(
                "URL:",
                `${process.env.REACT_APP_API_URL}/users/analyzeText`
            );

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/users/analyzeText`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        imagen: base64Data,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || data.err || "Error al analizar la imagen"
                );
            }

            console.log("Respuesta del servidor:", data);
            setResults(data);
            setError(null);

            // Buscar empleos coincidentes automáticamente
            if (data.tags && data.tags.length > 0) {
                console.log(
                    "[SEARCH] Iniciando búsqueda de empleos con habilidades:",
                    data.tags
                );
                await findMatchingJobs(data.tags);
            } else {
                console.warn(
                    "[WARNING] No se detectaron habilidades (tags vacío)"
                );
            }
        } catch (err) {
            console.error("Error al analizar la imagen:", err);
            setError(err.message || "Error al analizar la imagen");
            setResults(null);
        } finally {
            setAnalyzing(false);
        }
    };

    const findMatchingJobs = async (skills) => {
        setLoadingMatches(true);
        try {
            const token = localStorage.getItem("accessToken");

            console.log("[MATCH] Buscando empleos que coincidan con:", skills);
            console.log("[INFO] Total de habilidades a buscar:", skills.length);

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/match-skills`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        skills: skills,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("[ERROR] Error al buscar empleos:", data.message);
                setJobMatches({ total_matches: 0, matches: [] });
                return;
            }

            console.log("[SUCCESS] Empleos encontrados:", data.total_matches);
            console.log("[DATA] Detalles:", data);
            setJobMatches(data);
        } catch (err) {
            console.error("[ERROR] Error al buscar empleos coincidentes:", err);
            setJobMatches({ total_matches: 0, matches: [] });
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleApplyToJob = async (job) => {
        if (!user || !user.id) {
            setError("Debes iniciar sesión para postularte");
            return;
        }

        setApplyingToJob(job.empleo_id);
        console.log("Intentando postularse al empleo:", job.empleo_id);
        try {
            const token = localStorage.getItem("accessToken");
            const user = JSON.parse(localStorage.getItem("user"));
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/apply`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        jobId: job.empleo_id,
                    }),
                }
            );

            const data = await response.json();
            console.log("Respuesta al postularse:", data);

            if (!response.ok) {
                if (response.status === 409) {
                    alert("Ya te has postulado a este empleo anteriormente");
                } else {
                    throw new Error(data.message || "Error al postularse");
                }
                return;
            }

            alert(`¡Te has postulado exitosamente al puesto!`);

            // Actualizar el contador de postulados
            if (jobMatches && jobMatches.matches) {
                const updatedMatches = jobMatches.matches.map((m) =>
                    m.empleo_id === job.empleo_id
                        ? { ...m, postulados: parseInt(m.postulados) + 1 }
                        : m
                );
                setJobMatches({ ...jobMatches, matches: updatedMatches });
            }
        } catch (err) {
            console.error("Error al postularse:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setApplyingToJob(null);
        }
    };

    const handleViewJobDetails = (job) => {
        setSelectedJob(job);
        setShowJobDetails(true);
    };

    const closeJobDetailsModal = () => {
        setShowJobDetails(false);
        setSelectedJob(null);
    };

    const handleAnalyzeCV = async () => {
        if (!user || !user.cv) {
            setError("No tienes un CV registrado. Por favor sube uno primero.");
            return;
        }

        setAnalyzing(true);
        setError(null);
        setResults(null);
        setJobMatches(null); // Reset job matches
        setLoadingMatches(false); // Reset loading state

        try {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                throw new Error(
                    "No hay sesión activa. Por favor inicia sesión."
                );
            }

            console.log("Analizando CV del usuario...");
            console.log("CV URL:", user.cv);

            // Descargar el archivo del CV desde S3
            const fileResponse = await fetch(user.cv);
            if (!fileResponse.ok) {
                throw new Error("No se pudo descargar el CV");
            }

            const blob = await fileResponse.blob();

            let imageBase64;

            // Si es PDF, convertir a imagen usando canvas
            if (
                blob.type === "application/pdf" ||
                user.cv.toLowerCase().endsWith(".pdf")
            ) {
                console.log("Detectado PDF, convirtiendo a imagen...");

                try {
                    // Cargar PDF.js dinámicamente
                    // Importar PDF.js correctamente
                    const pdfjsLib = await import("pdfjs-dist");
                    const pdfjsWorker = await import(
                        "pdfjs-dist/build/pdf.worker.entry"
                    );

                    // Configurar worker
                    pdfjsLib.GlobalWorkerOptions.workerSrc =
                        pdfjsWorker.default;

                    // Convertir blob a arrayBuffer
                    const arrayBuffer = await blob.arrayBuffer();

                    // Cargar PDF
                    const pdf = await pdfjsLib.getDocument({
                        data: arrayBuffer,
                    }).promise;
                    console.log(`PDF cargado con ${pdf.numPages} página(s)`);

                    // Obtener la primera página
                    const page = await pdf.getPage(1);

                    // Preparar canvas
                    const scale = 2.0; // Mayor escala = mejor calidad
                    const viewport = page.getViewport({ scale });

                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    // Renderizar PDF en canvas
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;

                    console.log("PDF renderizado en canvas");

                    // Convertir canvas a base64
                    imageBase64 = canvas.toDataURL("image/png");
                    console.log("PDF convertido a imagen PNG");
                } catch (pdfError) {
                    console.error("Error al convertir PDF:", pdfError);
                    throw new Error(
                        "No se pudo convertir el PDF a imagen. Error: " +
                            pdfError.message
                    );
                }
            } else {
                // Si ya es imagen, convertir directamente a base64
                imageBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            // Establecer preview
            setPreview(imageBase64);

            // Enviar al backend para análisis con Rekognition
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/users/analyzeText`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        imagen: imageBase64,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || data.err || "Error al analizar el CV"
                );
            }

            console.log("Respuesta del servidor:", data);
            setResults(data);
            setError(null);
            setMode("auto");

            // Buscar empleos coincidentes automáticamente
            if (data.tags && data.tags.length > 0) {
                console.log(
                    "[SEARCH] Iniciando búsqueda de empleos con habilidades:",
                    data.tags
                );
                await findMatchingJobs(data.tags);
            } else {
                console.warn(
                    "[WARNING] No se detectaron habilidades (tags vacío)"
                );
            }
        } catch (err) {
            console.error("Error al analizar el CV:", err);
            setError(err.message || "Error al analizar el CV");
            setResults(null);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setPreview(null);
        setResults(null);
        setError(null);
        setMode("manual");
        setJobMatches(null); // Reset job matches
        setLoadingMatches(false); // Reset loading state
        const fileInput = document.getElementById("image-file-input");
        if (fileInput) fileInput.value = "";
    };

    return (
        <div className="image-analyzer-container">
            <div className="image-analyzer-card">
                <h2>Analizador de Texto en Imágenes</h2>
                <p className="subtitle">
                    Sube una imagen con texto y extraeremos las tecnologías y
                    habilidades detectadas
                </p>

                {/* Botón para analizar CV automáticamente */}
                {user && user.cv && (
                    <div className="auto-analyze-section">
                        <button
                            className="auto-analyze-btn"
                            onClick={handleAnalyzeCV}
                            disabled={analyzing}
                        >
                            {analyzing && mode === "auto" ? (
                                <>
                                    <span className="spinner"></span>
                                    Analizando tu CV...
                                </>
                            ) : (
                                <>
                                    <span className="icon">⚙</span>
                                    Analizar Mi CV Automáticamente
                                </>
                            )}
                        </button>
                        <p className="auto-analyze-hint">
                            Tu CV será analizado para identificar habilidades
                            técnicas
                        </p>
                    </div>
                )}

                <div className="divider">
                    <span>O</span>
                </div>

                <div className="upload-section">
                    <input
                        type="file"
                        id="image-file-input"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                    />

                    <button
                        className="select-file-btn"
                        onClick={handleButtonClick}
                        disabled={analyzing}
                    >
                        <span className="icon">�</span>
                        Seleccionar Imagen
                    </button>

                    {selectedImage && (
                        <div className="file-info">
                            <span className="file-name">
                                {selectedImage.name}
                            </span>
                            <span className="file-size">
                                ({(selectedImage.size / 1024).toFixed(2)} KB)
                            </span>
                        </div>
                    )}
                </div>

                {preview && (
                    <div className="preview-section">
                        <h3>Vista Previa:</h3>
                        <img
                            src={preview}
                            alt="Preview"
                            className="image-preview"
                        />
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <span className="icon">⚠</span>
                        {error}
                    </div>
                )}

                {results && (
                    <div className="results-section">
                        <h3>Resultados del Análisis</h3>
                        {mode === "auto" && (
                            <p className="cv-analyzed-badge">
                                ⚙ Análisis automático de tu CV
                            </p>
                        )}

                        {results.labels && results.labels.length > 0 && (
                            <div className="labels-section">
                                <h4>Texto Detectado:</h4>
                                <div className="labels-list">
                                    {results.labels.map((label, index) => (
                                        <div key={index} className="label-item">
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.tags && results.tags.length > 0 && (
                            <div className="tags-section">
                                <h4>Tecnologías/Habilidades Identificadas:</h4>
                                <div className="tags-container">
                                    {results.tags.map((tag, index) => (
                                        <span key={index} className="tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!results.labels || results.labels.length === 0) &&
                            (!results.tags || results.tags.length === 0) && (
                                <p className="no-results">
                                    No se detectaron textos o tecnologías en la
                                    imagen
                                </p>
                            )}
                    </div>
                )}

                {/* Sección de empleos coincidentes */}
                {loadingMatches && (
                    <div className="matching-section">
                        <h3>Buscando empleos coincidentes...</h3>
                        <div className="loading-jobs">
                            <span className="spinner"></span>
                            <p>Analizando ofertas de empleo disponibles...</p>
                        </div>
                    </div>
                )}

                {jobMatches && jobMatches.total_matches > 0 && (
                    <div className="matching-section">
                        <h3>
                            Empleos Coincidentes ({jobMatches.total_matches})
                        </h3>
                        <p className="matching-subtitle">
                            Encontramos {jobMatches.total_matches}{" "}
                            {jobMatches.total_matches === 1
                                ? "empleo"
                                : "empleos"}{" "}
                            que coinciden con tus habilidades
                        </p>

                        <div className="jobs-list">
                            {jobMatches.matches.map((job, index) => (
                                <div key={job.empleo_id} className="job-card">
                                    <div className="job-header">
                                        <div className="job-rank">
                                            #{index + 1}
                                        </div>
                                        <div className="job-title-section">
                                            <h4 className="job-title">
                                                {job.puesto}
                                            </h4>
                                            <div className="match-percentage">
                                                <div className="percentage-bar">
                                                    <div
                                                        className="percentage-fill"
                                                        style={{
                                                            width: `${job.match_percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="percentage-text">
                                                    {job.match_percentage}% de
                                                    coincidencia
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="job-description">
                                        {job.descripcion}
                                    </p>

                                    <div className="job-details">
                                        <div className="detail-item">
                                            <span className="detail-icon">
                                                $
                                            </span>
                                            <span className="detail-text">
                                                $
                                                {parseFloat(
                                                    job.salario
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-icon">
                                                �
                                            </span>
                                            <span className="detail-text">
                                                {job.postulados} postulados
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-icon">
                                                ✓
                                            </span>
                                            <span className="detail-text">
                                                {job.skills_matched}/
                                                {job.skills_required}{" "}
                                                habilidades
                                            </span>
                                        </div>
                                    </div>

                                    {job.habilidades_array &&
                                        job.habilidades_array.length > 0 && (
                                            <div className="job-skills">
                                                <h5>Habilidades requeridas:</h5>
                                                <div className="skills-tags">
                                                    {job.habilidades_array.map(
                                                        (skill, idx) => {
                                                            const isMatched =
                                                                job.matching_skills.some(
                                                                    (ms) =>
                                                                        ms.toLowerCase() ===
                                                                            skill
                                                                                .toLowerCase()
                                                                                .trim() ||
                                                                        skill
                                                                            .toLowerCase()
                                                                            .trim()
                                                                            .includes(
                                                                                ms.toLowerCase()
                                                                            ) ||
                                                                        ms
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                skill
                                                                                    .toLowerCase()
                                                                                    .trim()
                                                                            )
                                                                );
                                                            return (
                                                                <span
                                                                    key={idx}
                                                                    className={`skill-tag ${
                                                                        isMatched
                                                                            ? "matched"
                                                                            : "unmatched"
                                                                    }`}
                                                                >
                                                                    {isMatched && (
                                                                        <span className="check-icon">
                                                                            ✓
                                                                        </span>
                                                                    )}
                                                                    {skill}
                                                                </span>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    <div className="job-actions">
                                        <button
                                            className="btn-apply"
                                            onClick={() =>
                                                handleApplyToJob(job)
                                            }
                                            disabled={
                                                applyingToJob === job.empleo_id
                                            }
                                        >
                                            {applyingToJob === job.empleo_id ? (
                                                <>Postulando...</>
                                            ) : (
                                                <>Postularme</>
                                            )}
                                        </button>
                                        <button
                                            className="btn-details"
                                            onClick={() =>
                                                handleViewJobDetails(job)
                                            }
                                        >
                                            Ver más detalles
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {jobMatches &&
                    jobMatches.total_matches === 0 &&
                    !loadingMatches && (
                        <div className="matching-section">
                            <h3>Empleos Coincidentes</h3>
                            <div className="no-matches">
                                <span className="icon">ℹ</span>
                                <p>
                                    No se encontraron empleos que coincidan con
                                    tus habilidades actuales.
                                </p>
                                <p className="hint">
                                    Intenta analizar un CV más completo o espera
                                    a que se publiquen nuevas ofertas.
                                </p>
                            </div>
                        </div>
                    )}

                <div className="button-group">
                    <button
                        className="analyze-btn"
                        onClick={handleAnalyze}
                        disabled={!selectedImage || analyzing}
                    >
                        {analyzing && mode === "manual" ? (
                            <>
                                <span className="spinner"></span>
                                Analizando...
                            </>
                        ) : (
                            <>
                                <span className="icon">�</span>
                                Analizar Imagen
                            </>
                        )}
                    </button>

                    {(selectedImage || results || preview) && (
                        <button
                            className="reset-btn"
                            onClick={handleReset}
                            disabled={analyzing}
                        >
                            <span className="icon">↻</span>
                            Nuevo Análisis
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de detalles del empleo */}
            {showJobDetails && selectedJob && (
                <div
                    className="job-modal-overlay"
                    onClick={closeJobDetailsModal}
                >
                    <div
                        className="job-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="job-modal-close"
                            onClick={closeJobDetailsModal}
                        >
                            &times;
                        </button>

                        <h2 className="job-modal-title">Detalles del Empleo</h2>

                        <div className="job-modal-body">
                            <div className="job-modal-header">
                                <h3>{selectedJob.puesto}</h3>
                                <div className="job-modal-match">
                                    <span className="match-badge">
                                        {selectedJob.match_percentage}% de
                                        coincidencia
                                    </span>
                                </div>
                            </div>

                            <div className="job-modal-section">
                                <h4>Descripción</h4>
                                <p>{selectedJob.descripcion}</p>
                            </div>

                            <div className="job-modal-section">
                                <h4>Información Salarial</h4>
                                <p className="salary-info">
                                    $
                                    {parseFloat(
                                        selectedJob.salario
                                    ).toLocaleString()}{" "}
                                    / mes
                                </p>
                            </div>

                            <div className="job-modal-section">
                                <h4>Fecha de Publicación</h4>
                                <p>
                                    {new Date(
                                        selectedJob.fecha_creacion
                                    ).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>

                            <div className="job-modal-section">
                                <h4>Postulantes</h4>
                                <p>
                                    {selectedJob.postulados} personas ya se han
                                    postulado
                                </p>
                            </div>

                            <div className="job-modal-section">
                                <h4>
                                    Habilidades Requeridas (
                                    {selectedJob.skills_matched}/
                                    {selectedJob.skills_required})
                                </h4>
                                <div className="skills-tags">
                                    {selectedJob.habilidades_array &&
                                        selectedJob.habilidades_array.map(
                                            (skill, idx) => {
                                                const isMatched =
                                                    selectedJob.matching_skills.some(
                                                        (ms) =>
                                                            ms.toLowerCase() ===
                                                                skill
                                                                    .toLowerCase()
                                                                    .trim() ||
                                                            skill
                                                                .toLowerCase()
                                                                .trim()
                                                                .includes(
                                                                    ms.toLowerCase()
                                                                ) ||
                                                            ms
                                                                .toLowerCase()
                                                                .includes(
                                                                    skill
                                                                        .toLowerCase()
                                                                        .trim()
                                                                )
                                                    );
                                                return (
                                                    <span
                                                        key={idx}
                                                        className={`skill-tag ${
                                                            isMatched
                                                                ? "matched"
                                                                : "unmatched"
                                                        }`}
                                                    >
                                                        {isMatched && (
                                                            <span className="check-icon">
                                                                ✓
                                                            </span>
                                                        )}
                                                        {skill}
                                                    </span>
                                                );
                                            }
                                        )}
                                </div>
                            </div>

                            <div className="job-modal-actions">
                                <button
                                    className="btn-apply-modal"
                                    onClick={() => {
                                        handleApplyToJob(selectedJob);
                                        closeJobDetailsModal();
                                    }}
                                    disabled={
                                        applyingToJob === selectedJob.empleo_id
                                    }
                                >
                                    {applyingToJob === selectedJob.empleo_id ? (
                                        <>Postulando...</>
                                    ) : (
                                        <>Postularme a este empleo</>
                                    )}
                                </button>
                                <button
                                    className="btn-close-modal"
                                    onClick={closeJobDetailsModal}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageAnalyzer;
