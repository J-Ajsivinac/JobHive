import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const ResumeForm = ({ job }) => {
    const [translatedTitle, setTranslatedTitle] = useState(""); // Estado para manejar el título traducido
    const [isPlaying, setIsPlaying] = useState(false); // Estado para controlar si está reproduciendo
    const [audioElement, setAudioElement] = useState(null); // Referencia al audio actual

    if (!job) return null; // Si no hay trabajo seleccionado, no mostrar nada

    const handlePlayClick = async () => {
        try {
            // Si ya está reproduciendo, detener el audio
            if (isPlaying && audioElement) {
                audioElement.pause();
                setAudioElement(null);
                setIsPlaying(false);
                return;
            }

            setIsPlaying(true);

            // Extraer solo el texto plano de la descripción (sin HTML)
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = job.description;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";

            // Hacer la petición al endpoint de Polly
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/polly/synthesize`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: plainText,
                        voiceId: "Enrique", // Puedes cambiar la voz según prefieras
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Crear el audio desde el Base64
                const audioSrc = `data:audio/mp3;base64,${data.audioData}`;
                const audio = new Audio(audioSrc);

                // Configurar eventos del audio
                audio.onended = () => {
                    setIsPlaying(false);
                    setAudioElement(null);
                };

                audio.onerror = () => {
                    console.error("Error al reproducir el audio");
                    setIsPlaying(false);
                    setAudioElement(null);
                    alert("Error al reproducir el audio");
                };

                // Guardar referencia y reproducir
                setAudioElement(audio);
                await audio.play();
                console.log("Reproduciendo la descripción del puesto...");
            } else {
                throw new Error(data.error || "Error al generar el audio");
            }
        } catch (error) {
            console.error("Error al sintetizar voz:", error);
            setIsPlaying(false);
            setAudioElement(null);
            alert(
                "Error al reproducir la descripción. Por favor, intenta de nuevo."
            );
        }
    };

    const handleTranslateChange = (e) => {
        const selectedLanguage = e.target.value;
        // Lógica para traducir la descripción a otro idioma
        console.log("Traducir a:", selectedLanguage);

        if (selectedLanguage === "es") {
            setTranslatedTitle(job.description);
        } else {
            fetch(process.env.REACT_APP_TRANSLATE_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    texto: job.description,
                    source_language: "es",
                    target_language: selectedLanguage,
                }),
            })
                .then(async (response) => {
                    if (!response.ok) {
                        const text = await response.text();
                        throw new Error(
                            `HTTP error! status: ${response.status}, message: ${text}`
                        );
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.texto_traducido) {
                        setTranslatedTitle(data.texto_traducido);
                    } else {
                        console.error(
                            "No se encontró texto_traducido en la respuesta:",
                            data
                        );
                        setTranslatedTitle("Error: No se pudo traducir");
                    }
                })
                .catch((error) => {
                    console.error("Error al traducir:", error);
                    setTranslatedTitle("Error al traducir");
                });
        }
    };

    return (
        <form
            className="job-form"
            style={{ maxHeight: "500px", overflowY: "scroll" }}
        >
            <div className="form-header">
                <h2>{job.title}</h2>
                <p className="salary-info">
                    <strong>Salario: </strong>
                    {job.salary}
                </p>
            </div>

            <div className="form-group1">
                <p className="job-info">
                    <strong>Fecha de Publicación: </strong>
                    {job.date}
                </p>
            </div>

            <div className="form-group1">
                <div className="skills-input-container">
                    <p className="skills-title">
                        <strong>Habilidades:</strong>
                    </p>
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
                <p>
                    <strong>Descripción del puesto:</strong>
                </p>
                <ReactQuill
                    value={job.description}
                    readOnly={true}
                    theme="bubble"
                    style={{ maxHeight: "200px", overflowY: "auto" }} // Limita el tamaño del editor con barra de desplazamiento
                />
                <div
                    style={{
                        marginTop: "10px",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ marginRight: "10px" }}>Escuchar</span>
                    <button
                        onClick={handlePlayClick}
                        disabled={isPlaying}
                        type="button"
                        style={{
                            backgroundColor: isPlaying ? "#FF9800" : "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: isPlaying ? "not-allowed" : "pointer",
                            fontSize: "16px",
                            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                            transition: "background-color 0.3s ease",
                            marginRight: "20px",
                            opacity: isPlaying ? 0.7 : 1,
                        }}
                        title={
                            isPlaying
                                ? "Reproduciendo..."
                                : "Reproducir descripción"
                        }
                    >
                        {isPlaying ? "⏸" : "▷"}
                    </button>

                    <span style={{ marginRight: "10px" }}>Translate:</span>
                    <select
                        onChange={handleTranslateChange}
                        style={{ padding: "5px", borderRadius: "5px" }}
                    >
                        <option value="es">Español</option>
                        <option value="en">Inglés</option>
                        <option value="fr">Francés</option>
                        <option value="de">Alemán</option>
                    </select>
                </div>
            </div>

            {/* Título traducido del puesto */}
            <div className="form-group1" style={{ marginTop: "20px" }}>
                <p>
                    <strong>Título del Puesto Traducido:</strong>
                </p>
                <ReactQuill
                    value={translatedTitle}
                    readOnly={true}
                    theme="bubble"
                    style={{ maxHeight: "100px", overflowY: "auto" }} // Limita el tamaño del editor con barra de desplazamiento
                />
            </div>
        </form>
    );
};

export default ResumeForm;
