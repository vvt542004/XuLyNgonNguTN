import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UserView from "./pages/UserView";
import AdminDashboard from "./pages/AdminDashboard";

// Icons (Heroicons)
const SunIcon = () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05 5.636 5.636" />
    </svg>
);

const MoonIcon = () => (
    <svg width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 12 17a7 7 0 0 0 9-4.21z" />
    </svg>
);

const UserIcon = () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
);

const AdminIcon = () => (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2 3 7v6c0 5 3.5 9 9 9s9-4 9-9V7l-9-5z" />
        <path d="M9 12h6M9 16h6" />
    </svg>
);

export default function App() {
    const [darkMode, setDarkMode] = useState(false);

    const theme = {
        background: darkMode ? "#111827" : "#e5e7eb",
        text: darkMode ? "#f3f4f6" : "#1f2937",
        cardBg: darkMode ? "#1f2937" : "white",
        navbarBg: darkMode ? "#1f2937" : "white",
        navbarBorder: darkMode ? "#374151" : "#e5e7eb",
        shadow: darkMode ? "0 4px 20px rgba(0,0,0,0.55)" : "0 4px 14px rgba(0,0,0,0.08)"
    };

    const appWrapper = {
        fontFamily: "Inter, sans-serif",
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        transition: "0.25s",
    };

    const navbar = {
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: theme.navbarBg,
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: theme.shadow,
        borderBottom: `1px solid ${theme.navbarBorder}`,
        transition: "0.25s",
    };

    const navLeft = {
        display: "flex",
        gap: "24px",
    };

    const linkStyle = {
        color: theme.text,
        textDecoration: "none",
        fontSize: "16px",
        fontWeight: 600,
        padding: "10px 18px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "0.25s",
    };

    /** FIX: dùng currentTarget để icon KHÔNG bị xanh */
    const linkHover = (e) => {
        e.currentTarget.style.background = "#2563eb";
        e.currentTarget.style.color = "white";
    };

    const linkLeave = (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = theme.text;
    };

    const pageWrapper = {
        padding: "40px 20px",
    };

    const contentCard = {
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 48px",
        background: theme.cardBg,
        borderRadius: "16px",
        boxShadow: theme.shadow,
        transition: "0.25s",
    };

    return (
        <Router>
            <div style={appWrapper}>

                {/* NAVBAR */}
                <nav style={navbar}>
                    <div style={navLeft}>
                        <Link
                            to="/"
                            style={linkStyle}
                            onMouseOver={linkHover}
                            onMouseLeave={linkLeave}
                        >
                            <UserIcon /> Trang người dùng
                        </Link>

                        <Link
                            to="/admin"
                            style={linkStyle}
                            onMouseOver={linkHover}
                            onMouseLeave={linkLeave}
                        >
                            <AdminIcon /> Quản lý bình luận
                        </Link>
                    </div>

                    {/* Toggle Dark Mode */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: theme.text,
                        }}
                    >
                        {darkMode ? <SunIcon /> : <MoonIcon />}
                    </button>
                </nav>

                {/* MAIN CONTENT */}
                <div style={pageWrapper}>
                    <div style={contentCard}>
                        <Routes>
                            <Route path="/" element={<UserView />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Routes>
                    </div>
                </div>

            </div>
        </Router>
    );
}
