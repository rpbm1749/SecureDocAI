import './App.css'
import { useState } from 'react'
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import Home from './content/Home.jsx'
import AddFile from './content/AddFile.jsx'
import ViewFiles from './content/ViewFiles.jsx'
import RedactFiles from './content/RedactFiles.jsx'
import GetSummary from './content/GetSummary.jsx'
import SeeSharedFiles from './content/SeeShared.jsx';


function Dashboard({ setContent }) {
    const [dashboardContent, setDashboardContent] = useState(<Home />);
    const [activeSection, setActiveSection] = useState('home');

    const handleHomeClick = () => {
        setDashboardContent(<Home />);
        setActiveSection('home');
    };
    const handleAddFileClick = () => {
        setDashboardContent(<AddFile />);
        setActiveSection('addfile');
    };
    const handleViewFilesClick = () => {
        setDashboardContent(<ViewFiles />);
        setActiveSection('viewfiles');
    };
    const handleRedactFilesClick = () => {
        setDashboardContent(<RedactFiles />);
        setActiveSection('redact');
    };
    const handleGetSummaryClick = () => {
        setDashboardContent(<GetSummary />);
        setActiveSection('summary');
    };
    const handleSeeShared = () => {
        setDashboardContent(<SeeSharedFiles />);
        setActiveSection('shared');
    };

    const getButtonClass = (section) => {
        const baseClass = 'px-4 py-3 rounded-lg sidebarItem font-medium transition-all duration-200 cursor-pointer';
        if (activeSection === section) {
            return `${baseClass} bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md`;
        }
        return `${baseClass} bg-gray-700 text-gray-200 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-700 hover:text-white shadow-sm`;
    };

    const handleLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            localStorage.removeItem("userId");
            alert("Logged out successfully");
            setContent('login');
        } catch (err) {
            alert("Error logging out: " + err.message);
        }
    };

    return (
        <div className='flex flex-row h-screen bg-gray-900 dashboardContainer'>
            <div className='flex flex-col max-w-75 w-[30vw] pl-5 pr-5 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg dashboardSidebar border-r border-gray-700'>
                <div className='flex flex-row h-15 items-center gap-3 py-4 sidebarHeader border-b border-gray-700'>
                    <div className='border-2 border-blue-500 rounded-full w-10 h-10 overflow-hidden image-container'>
                        <img src="https://via.placeholder.com/150" alt="Profile" className='profileImage' />
                    </div>
                    <span className='text-sm font-semibold text-blue-300'>User Profile</span>
                </div>
                <div className='flex flex-col gap-2 mt-6 sidebarBody'>
                    <button onClick={handleHomeClick} className={getButtonClass('home')}>🏠 Home</button>
                    <button onClick={handleAddFileClick} className={getButtonClass('addfile')}>📤 Add a new file</button>
                    <button onClick={handleViewFilesClick} className={getButtonClass('viewfiles')}>📁 View my files</button>
                    <button onClick={handleRedactFilesClick} className={getButtonClass('redact')}>🔐 Redact Files</button>
                    <button onClick={handleGetSummaryClick} className={getButtonClass('summary')}>📝 Get Summary</button>
                    <button onClick={handleSeeShared} className={getButtonClass('shared')}>🤝 See Shared Files</button>
                </div>
            </div>

            <div className='flex-1 flex flex-col dashboardBody'>
                <div className='flex flex-row items-center justify-between px-10 py-6 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 dashboardHeader shadow-md'>
                    <div className='flex-1 text-center text-3xl font-bold text-white heading'>SecureDocAI Dashboard</div>
                    <button onClick={handleLogout} className='px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-200 cursor-pointer logoutButton shadow-md'>Logout</button>
                </div>
                <div className='flex-1 p-8 overflow-auto dashboardContent bg-gray-900'>{dashboardContent}</div>
            </div>
        </div>
    );
}

export default Dashboard;