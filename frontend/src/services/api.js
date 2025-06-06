import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_URL = `${API_BASE_URL}/family`; // Adjust backend URL if needed

// Helper to get token from localStorage
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getFamilyMembers = async () => {
  const response = await axios.get(`${API_URL}/members`, { headers: { ...getAuthHeaders() } });
  return response.data;
};

export const getFamilyMember = async (id) => {
  const response = await axios.get(`${API_URL}/members/${id}`, { headers: { ...getAuthHeaders() } });
  return response.data;
};

export const getMemberRelations = async (id) => {
  const response = await axios.get(`${API_URL}/relationships/${id}`, { headers: { ...getAuthHeaders() } });
  return response.data.map(relation => ({
    id: relation.relative_id,
    name: `${relation.relative_name}`,
    type: relation.relationship_type,
  }));
};

export const getRelationships = async () => {
  const response = await axios.get(`${API_URL}/relationships`, { headers: { ...getAuthHeaders() } });
  return response.data;
};

export const addFamilyMember = async (data) => {
  // If data.profile_picture is a base64 string, upload as multipart/form-data
  if (data.profile_picture && data.profile_picture.startsWith("data:")) {
    const formData = new FormData();
    // Convert base64 to Blob
    const arr = data.profile_picture.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.split("/")[1] || "png";
    const filename = `profile_${Date.now()}.${ext}`;
    const file = new File([u8arr], filename, { type: mime });

    formData.append("profile_picture_file", file);
    // Remove profile_picture from data, will be set by backend
    const { profile_picture, ...rest } = data;
    formData.append("personData", JSON.stringify(rest));
    const response = await axios.post(`${API_URL}/members`, formData, {
      headers: { "Content-Type": "multipart/form-data", ...getAuthHeaders() }
    });
    return response.data;
  } else {
    // Send as JSON (no file upload)
    const response = await axios.post(`${API_URL}/members`, data, { headers: { ...getAuthHeaders() } });
    return response.data;
  }
};

export const updateFamilyMember = async (id, data) => {
  // If data.profile_picture is a base64 string, upload as multipart/form-data
  if (data.profile_picture && data.profile_picture.startsWith("data:")) {
    const formData = new FormData();
    const arr = data.profile_picture.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.split("/")[1] || "png";
    const filename = `profile_${Date.now()}.${ext}`;
    const file = new File([u8arr], filename, { type: mime });

    formData.append("profile_picture_file", file);
    const { profile_picture, ...rest } = data;
    formData.append("personData", JSON.stringify(rest));
    const response = await axios.put(`${API_URL}/members/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data", ...getAuthHeaders() }
    });
    return response.data;
  } else {
    // Send as JSON (no file upload)
    const response = await axios.put(`${API_URL}/members/${id}`, data, { headers: { ...getAuthHeaders() } });
    return response.data;
  }
};

export const deleteFamilyMember = async (id) => {
  const response = await axios.delete(`${API_URL}/members/${id}`, { headers: { ...getAuthHeaders() } });
  return response.data;
};

export const getRecentMembers = async () => {
  const response = await axios.get(`${API_URL}/members/recent`, { headers: { ...getAuthHeaders() } });
  return response.data.slice(0, 5); // Return only the last 5 members
};

export const getFamilyEvents = async () => {
  const response = await axios.get(`${API_URL}/events`, { headers: { ...getAuthHeaders() } });
  return response.data;
};

export const getHelpFAQ = async () => {
  const response = await axios.get(`${API_URL}/help/faq`, { headers: { ...getAuthHeaders() } });
  return response.data;
};

export const getHelpAbout = async () => {
  const response = await axios.get(`${API_URL}/help/about`, { headers: { ...getAuthHeaders() } });
  return response.data.about;
};

export const getHelpContact = async () => {
  const response = await axios.get(`${API_URL}/help/contact`, { headers: { ...getAuthHeaders() } });
  return response.data.contact;
};

export const getFamilyTree = async (personId) => {
  const response = await axios.get(`${API_URL}/tree/${personId}`, { headers: { ...getAuthHeaders() } });
  return response.data;
};

export const addMarriage = async ({ person_id, spouse_id, marriage_date, divorce_date }) => {
  const response = await axios.post(`${API_URL}/marriages`, {
    person_id,
    spouse_id,
    marriage_date,
    divorce_date,
  }, { headers: { ...getAuthHeaders() } });
  return response.data;
};