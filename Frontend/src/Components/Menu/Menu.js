import React from "react";
import { FaBriefcase, FaRegFile, FaUser } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

const Menu = ({ isOpen, onPanelChange }) => {
    const isMobile = window.innerWidth <= 768;
    const navigate = useNavigate();

    // Obtener información del usuario para determinar si es admin
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.admin === 1;
    const userName = isAdmin
        ? "Administrador"
        : `${user.first_name || "Usuario"}`;

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className={`menu ${isOpen ? "show" : ""}`}>
            <div className="profile">
                <img src="/Profile.svg" alt="User Icon" />
                <span className="user-name">{userName}</span>
            </div>
            <ul className="menu-options">
                <li className="menu-item" onClick={() => onPanelChange("jobs")}>
                    <FaBriefcase className="menu-icon" /> Empleos
                </li>
                <li
                    className="menu-item"
                    onClick={() => onPanelChange("applications")}
                >
                    <FaRegFile className="menu-icon" />{" "}
                    {isAdmin ? "Postulados" : "Mis Postulaciones"}
                </li>
                {!isAdmin && (
                    <li
                        className="menu-item"
                        onClick={() => onPanelChange("profile")}
                    >
                        <FaUser className="menu-icon" /> Mi Perfil
                    </li>
                )}
                {isMobile && (
                    <>
                        <li className="menu-item logout" onClick={handleLogout}>
                            <IoIosLogOut className="menu-icon logout" /> Salir
                        </li>
                    </>
                )}
            </ul>
        </div>
    );
};

export default Menu;
