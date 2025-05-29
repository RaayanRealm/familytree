import React, { useEffect, useState } from "react";
import { getHelpFAQ } from "../services/api";
import "../styles/HelpPages.css";

const HelpFAQ = () => {
    const [faqs, setFaqs] = useState([]);
    useEffect(() => {
        getHelpFAQ().then(setFaqs);
    }, []);
    return (
        <div className="help-container">
            <h2 className="help-title">Frequently Asked Questions</h2>
            <ul className="faq-list">
                {faqs.map((faq, idx) => (
                    <li key={idx} className="faq-item">
                        <div className="faq-question">Q: {faq.question}</div>
                        <div className="faq-answer">A: {faq.answer}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
export default HelpFAQ;
