import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchAllMembers } from "../services/api";

const MembersCacheContext = createContext();

export const MembersCacheProvider = ({ children }) => {
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        fetchAllMembers().then(members => {
            if (mounted) {
                setAllMembers(members);
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    return (
        <MembersCacheContext.Provider value={{ allMembers, loading }}>
            {children}
        </MembersCacheContext.Provider>
    );
};

export const useAllMembers = () => useContext(MembersCacheContext);
