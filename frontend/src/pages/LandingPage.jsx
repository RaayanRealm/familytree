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
            <h1>Welcome to the Family Database</h1>
            <RecentMembersCarousel members={recentMembers} />
        </div>
    );
};

export default LandingPage;