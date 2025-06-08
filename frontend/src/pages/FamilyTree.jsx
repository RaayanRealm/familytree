import React, { useState, useCallback, useEffect } from "react";
import { getFamilyTree, getFamilyMembersPaginated } from "../services/api";
import "../styles/FamilyTree.css";
import Tree from "react-d3-tree";
import { Link } from "react-router-dom";
import AsyncSelect from "react-select/async";

// Custom node rendering for react-d3-tree
const renderCustomNode = ({ nodeDatum }) => {
    const { id, profile_picture, spouses = [] } = nodeDatum.attributes || {};
    return (
        <g>
            {/* Person's profile picture (always round and small) */}
            <circle
                cx={0}
                cy={-25}
                r={26}
                fill="#fff"
                stroke="#01a982"
                strokeWidth={2}
            />
            <clipPath id={`clip-${id}`}>
                <circle cx={0} cy={-25} r={24} />
            </clipPath>
            <image
                href={profile_picture ? `http://localhost:5000${profile_picture}` : "/default-avatar.png"}
                x={-24}
                y={-49}
                width={48}
                height={48}
                clipPath={`url(#clip-${id})`}
                style={{ pointerEvents: "none" }}
            />
            {/* Person's name as a link */}
            <foreignObject x={-60} y={0} width={120} height={40}>
                <div style={{ textAlign: "center" }}>
                    <Link
                        to={`/member/${id}`}
                        style={{
                            color: "#01a982",
                            fontWeight: 600,
                            textDecoration: "underline",
                            fontSize: "1.05rem",
                            wordBreak: "break-word"
                        }}
                    >
                        {nodeDatum.name}
                    </Link>
                </div>
            </foreignObject>
            {/* Spouses (if any) */}
            {spouses.length > 0 && (
                <foreignObject x={-60} y={35} width={120} height={40}>
                    <div style={{ textAlign: "center", fontSize: "0.95rem", color: "#06b6d4" }}>
                        {spouses.map(spouse => (
                            <span key={spouse.id} style={{ margin: "0 4px" }}>
                                <img
                                    src={spouse.profile_picture ? `http://localhost:5000${spouse.profile_picture}` : "/default-avatar.png"}
                                    alt={spouse.name}
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: "50%",
                                        verticalAlign: "middle",
                                        marginRight: 3,
                                        border: "1.5px solid #01a982",
                                        objectFit: "cover"
                                    }}
                                />
                                <Link
                                    to={`/member/${spouse.id}`}
                                    style={{
                                        color: "#06b6d4",
                                        fontWeight: 500,
                                        textDecoration: "underline"
                                    }}
                                >
                                    {spouse.name}
                                </Link>
                            </span>
                        ))}
                    </div>
                </foreignObject>
            )}
        </g>
    );
};

const FamilyTree = () => {
    const [personId, setPersonId] = useState("");
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allMembers, setAllMembers] = useState([]);

    // Fetch all members for search
    useEffect(() => {
        getFamilyMembersPaginated().then(data => setAllMembers(data.members || []));
    }, []);

    // react-select async search
    const loadMemberOptions = (inputValue, callback) => {
        if (!inputValue) {
            callback([]);
            return;
        }
        const filtered = allMembers
            .filter(m =>
                `${m.first_name} ${m.last_name}`.toLowerCase().includes(inputValue.toLowerCase())
            )
            .map(m => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name}`
            }));
        callback(filtered);
    };

    const handleShowTree = async () => {
        if (!personId) return;
        setLoading(true);
        const data = await getFamilyTree(personId);
        setTreeData(data);
        setLoading(false);
    };

    // Responsive centering for tree
    const [dimensions, setDimensions] = useState({ width: 1200, height: 700 });
    const containerRef = useCallback(node => {
        if (node !== null) {
            setDimensions({
                width: node.offsetWidth,
                height: node.offsetHeight
            });
        }
    }, []);

    return (
        <div className="family-tree-container">
            <h2>Family Tree Viewer</h2>
            <div className="tree-search-bar">
                <AsyncSelect
                    cacheOptions
                    loadOptions={loadMemberOptions}
                    defaultOptions={allMembers.slice(0, 10).map(m => ({
                        value: m.id,
                        label: `${m.first_name} ${m.last_name}`
                    }))}
                    onChange={option => setPersonId(option ? option.value : "")}
                    placeholder="Search & select member"
                    classNamePrefix="relation-async-select"
                    isClearable
                    styles={{
                        container: base => ({
                            ...base,
                            minWidth: 260,
                            maxWidth: 350,
                            marginRight: "1rem"
                        })
                    }}
                />
                <button onClick={handleShowTree} disabled={!personId || loading}>
                    {loading ? "Loading..." : "Show Tree"}
                </button>
            </div>
            <div
                className="tree-visualization"
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "80vh",
                    minHeight: 600,
                    maxHeight: "90vh",
                    background: "#fff",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 8px rgba(1, 169, 130, 0.07)",
                    overflow: "auto"
                }}
            >
                {treeData && (
                    <Tree
                        data={treeData}
                        orientation="horizontal"
                        translate={{
                            x: dimensions.width / 2,
                            y: dimensions.height / 2
                        }}
                        collapsible={true}
                        zoomable={true}
                        renderCustomNodeElement={renderCustomNode}
                        separation={{ siblings: 1.5, nonSiblings: 2.2 }}
                        pathFunc="step"
                        scaleExtent={{ min: 0.2, max: 2.5 }}
                        initialDepth={2}
                        shouldCollapseNeighborNodes={false}
                        nodeSize={{ x: 180, y: 120 }}
                    />
                )}
            </div>
        </div>
    );
};

export default FamilyTree;
