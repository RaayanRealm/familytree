import React, { useEffect, useState } from "react";
import RecentMembersCarousel from "../components/RecentMembersCarousel";
import { getRecentMembers } from "../services/api";
import "../styles/LandingPage.css";

const LandingPage = () => {
    const [recentMembers, setRecentMembers] = useState([]);

    useEffect(() => {
        getRecentMembers().then(setRecentMembers); // Fetch the last 5 members
    }, []);

    return (
        <div className="landing-page">
            {/* ✅ Hero Section */}
            <section className="hero-section">
                <h1>Welcome to Your Family Tree</h1>
                <p>Discover your roots and explore family connections.</p>
            </section>

            {/* ✅ Recent Members Carousel */}
            <section className="carousel-container">
                <RecentMembersCarousel members={recentMembers} />
            </section>

            {/* ✅ Grid Sections */}
            <section className="grid-layout">
                <div className="grid-item"><a href="/family/tree">Family Tree</a></div>
                <div className="grid-item"><a href="/events">Events</a></div>
                <div className="grid-item"><a href="/stories">Stories</a></div>
                <div className="grid-item"><a href="/achievements">Achievements</a></div>
            </section>
        </div>
    );
};

export default LandingPage;