import React from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import Search from "./Search";
import { getFamilyMembers } from "../services/api";
import { useEffect, useState } from "react";


const Header = () => {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        getFamilyMembers().then(setMembers); // ✅ Fetch all members for search
    }, []);

    return (
        <header className="header">
            <div className="logo-title">
                <h1>🌳 Family Database</h1>
            </div>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li className="dropdown">
                        <span>Family Tree Heads ▼</span>
                        <ul className="dropdown-menu">
                            <li><Link to="/family/paternal">Paternal</Link></li>
                            <li><Link to="/family/maternal">Maternal</Link></li>
                        </ul>
                    </li>
                    <li className="dropdown">
                        <span>Help ▼</span>
                        <ul className="dropdown-menu">
                            <li><Link to="/help/faq">FAQ</Link></li>
                            <li><Link to="/help/contact">Contact Us</Link></li>
                            <li><Link to="/help/about">About Family Tree</Link></li>
                        </ul>
                    </li>
                    <Search members={members} />
                </ul>
            </nav>
        </header>
    );
};

export default Header;