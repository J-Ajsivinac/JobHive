import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./User.css";
import TopBar from "../../Components/TopBar/TopBar";
import Menu from "../../Components/Menu/Menu";
import Jobs from "../../Components/Panels/GetJob";
import MyApplications from "../../Components/Panels/MyApplications";
import UserProfile from "../../Components/Panels/UserProfile";
import ImageAnalyzer from "../../Components/Panels/ImageAnalyzer";

const User = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [activePanel, setActivePanel] = useState(() => {
        const savedPanel = localStorage.getItem("activePanel");
        return savedPanel ? savedPanel : "jobs";
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        // Verifica si el usuario está logueado y es admin
        if (!user || user.admin == 1) {
            navigate("/");
        }
    }, [navigate]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handlePanelChange = (panel) => {
        setActivePanel(panel);
        localStorage.setItem("activePanel", panel);
    };

    const renderPanel = () => {
        switch (activePanel) {
            case "jobs":
                return <Jobs />;
            case "applications":
                return <MyApplications />;
            case "profile":
                return <UserProfile />;
            case "analyzer":
                return <ImageAnalyzer />;
            default:
                return <Jobs />;
        }
    };

    return (
        <div className="container-panel">
            <TopBar toggleMenu={toggleMenu} menuOpen={menuOpen} />
            <div className="main">
                <Menu isOpen={menuOpen} onPanelChange={handlePanelChange} />
                <div className="panel-section">{renderPanel()}</div>
            </div>
        </div>
    );
};

export default User;
