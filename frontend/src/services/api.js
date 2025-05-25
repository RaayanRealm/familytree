import axios from "axios";

const API_URL = "http://localhost:5000/api/family"; // Adjust backend URL if needed

export const getFamilyMembers = async () => {
  const response = await axios.get(`${API_URL}/members`);
  return response.data;
};

export const getFamilyMember = async (id) => {
  const response = await axios.get(`${API_URL}/members/${id}`);
  return response.data;
};

export const getMemberRelations = async (id) => {
  const response = await axios.get(`${API_URL}/relationships/${id}`);
  return response.data.map(relation => ({
    id: relation.id,  // ✅ Ensure the ID is passed
    name: `${relation.first_name} ${relation.last_name}`,
    type: relation.relationship_type,
  }));
};

export const getRelationships = async () => {
  const response = await axios.get(`${API_URL}/relationships`);
  return response.data;
};

export const addFamilyMember = async (data) => {
  const response = await axios.post(`${API_URL}/members`, data);
  return response.data;
};

export const deleteFamilyMember = async (id) => {
  const response = await axios.delete(`${API_URL}/members/${id}`);
  return response.data;
};

export const getRecentMembers = async () => {
  const response = await axios.get(`${API_URL}/members/recent`);
  return response.data.slice(0, 5); // Return only the last 5 members
}