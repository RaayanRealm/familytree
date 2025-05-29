import React, { useEffect, useState } from "react";
import { getHelpAbout } from "../services/api";
import "../styles/HelpPages.css";

const HelpAbout = () => {
    const [about, setAbout] = useState("");
    useEffect(() => {
        getHelpAbout().then(setAbout);
    }, []);
    return (
        <div className="help-container">
            <h2 className="help-title">About Family Tree</h2>
            <div className="help-content">{about}</div>
        </div>
    );
};
export default HelpAbout;
