import React, { useEffect, useState } from "react";
import { getHelpContact } from "../services/api";
import "../styles/HelpPages.css";

const HelpContact = () => {
    const [contact, setContact] = useState("");
    useEffect(() => {
        getHelpContact().then(setContact);
    }, []);
    return (
        <div className="help-container">
            <h2 className="help-title">Contact Us</h2>
            <div className="help-content">{contact}</div>
        </div>
    );
};
export default HelpContact;
