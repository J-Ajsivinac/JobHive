import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import TopBar from '../../Components/TopBar/TopBar';
import Menu from '../../Components/Menu/Menu';
import Jobs from '../../Components/Panels/Jobs';
import JobApplications from '../../Components/Panels/JobApplications';

const Admin = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [activePanel, setActivePanel] = useState(() => {
        const savedPanel = localStorage.getItem('activePanel');
        return savedPanel ? savedPanel : 'jobs';
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));

        // Verifica si el usuario está logueado y es admin
        if (!user || user.admin == 0) {
            navigate('/');
        }
    }, [navigate]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handlePanelChange = (panel) => {
        setActivePanel(panel);
        localStorage.setItem('activePanel', panel);
    };

    return (
        <div className='container-panel'>
            <TopBar toggleMenu={toggleMenu} menuOpen={menuOpen} />
            <div className='main'>
                <Menu isOpen={menuOpen} onPanelChange={handlePanelChange} />
                <div className='panel-section'>
                    {activePanel === 'jobs' ? <Jobs /> : <JobApplications />}
                </div>
            </div>
        </div>
    );
};

export default Admin;
