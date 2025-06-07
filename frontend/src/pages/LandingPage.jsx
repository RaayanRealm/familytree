import React, { useEffect, useState } from "react";
import RecentMembersCarousel from "../components/RecentMembersCarousel";
import { getRecentMembers } from "../services/api";
import "./../styles/LandingPage.css";

const LandingPage = () => {
    const [recentMembers, setRecentMembers] = useState([]);

    useEffect(() => {
        getRecentMembers().then(setRecentMembers); // Fetch the last 5 members
    }, []);

    return (
        <div className="lemonade-landing-bg">
            <div className="lemonade-hero">
                <div className="lemonade-hero-content">
                    <h1 className="lemonade-hero-title">Welcome to Family Tree</h1>
                    <p className="lemonade-hero-desc">
                        Discover, connect, and celebrate your family story with a fresh, modern experience.
                    </p>
                    <button className="lemonade-hero-btn" onClick={() => window.location.href = "/add-member"}>
                        Get Started
                    </button>
                </div>
                <div className="lemonade-hero-carousel">
                    {/* Replace with your carousel component, but make it bigger */}
                    <div className="lemonade-carousel-big">
                        {/* ...your carousel images/components here... */}
                    </div>
                </div>
            </div>

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