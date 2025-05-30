import React from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import Search from "./Search";
import { getFamilyMembers } from "../services/api";
import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";


const Header = () => {
    const [members, setMembers] = useState([]);
    const [editMemberId, setEditMemberId] = useState("");

    useEffect(() => {
        getFamilyMembers().then(setMembers); // ✅ Fetch all members for search
    }, []);

    // For react-select async search
    const loadMemberOptions = (inputValue, callback) => {
        if (!inputValue) {
            callback([]);
            return;
        }
        const filtered = members
            .filter(m =>
                `${m.first_name} ${m.last_name}`.toLowerCase().includes(inputValue.toLowerCase())
            )
            .map(m => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name}`
            }));
        callback(filtered);
    };

    return (
        <header className="header">
            <div className="logo-title">
                <h1>🌳 Family Database</h1>
            </div>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li className="dropdown">
                        <span>Add ▼</span>
                        <ul className="dropdown-menu">
                            <li>
                                <Link to="/add-member" className="add-member-header-btn">
                                    Add Member
                                </Link>
                            </li>
                            <li>
                                <Link to="/add-marriage" className="add-member-header-btn">
                                    Add Marriage
                                </Link>
                            </li>
                            <li style={{ minWidth: 220 }}>
                                <AsyncSelect
                                    cacheOptions
                                    loadOptions={loadMemberOptions}
                                    defaultOptions={members.slice(0, 10).map(m => ({
                                        value: m.id,
                                        label: `${m.first_name} ${m.last_name}`
                                    }))}
                                    onChange={option => {
                                        if (option && option.value) {
                                            window.location.href = `/edit-member/${option.value}`;
                                        }
                                    }}
                                    placeholder="Edit Member..."
                                    classNamePrefix="relation-async-select"
                                    isClearable
                                    styles={{
                                        container: base => ({
                                            ...base,
                                            minWidth: 180,
                                            maxWidth: 260,
                                            margin: "0.2rem 0"
                                        }),
                                        menu: base => ({
                                            ...base,
                                            zIndex: 9999
                                        })
                                    }}
                                />
                            </li>
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