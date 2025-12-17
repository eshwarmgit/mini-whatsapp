import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (username, password, name) =>
    api.post("/auth/register", { username, password, name }),
  login: (username, password) =>
    api.post("/auth/login", { username, password }),
  getUsers: () => api.get("/auth/users")
};

// Chat endpoints
export const chatAPI = {
  sendMessage: (receiver, content) =>
    api.post("/chat/send", { receiver, content }),
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  deleteForMe: (messageId) =>
    api.patch(`/chat/delete-for-me/${messageId}`),
  deleteForEveryone: (messageId) =>
    api.patch(`/chat/delete-for-everyone/${messageId}`)
};

// Group endpoints
export const groupAPI = {
  create: (name, members) =>
    api.post("/groups/create", { name, members }),
  getMyGroups: () => api.get("/groups/my"),
  getGroup: (groupId) => api.get(`/groups/${groupId}`),
  getGroupMessages: (groupId) => api.get(`/groups/${groupId}/messages`),
  addMembers: (groupId, members) =>
    api.patch(`/groups/${groupId}/add-members`, { members }),
  removeMember: (groupId, memberId) =>
    api.patch(`/groups/${groupId}/remove-member`, { memberId }),
  leaveGroup: (groupId) => api.patch(`/groups/${groupId}/leave`)
};
