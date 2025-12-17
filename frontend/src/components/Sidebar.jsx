import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import "../styles/sidebar.css";

export default function Sidebar({
  contacts,
  groups,
  selectedChat,
  onSelectChat,
  onCreateGroup,
  onlineUsers,
  loading = false
}) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setAllUsers(response.data.filter((u) => (u._id || u.id) !== (user._id || user.id)));
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.size === 0) {
      alert("Please enter a group name and select at least one member");
      return;
    }

    onCreateGroup(groupName, Array.from(selectedMembers));
    setShowGroupModal(false);
    setGroupName("");
    setSelectedMembers(new Set());
  };

  const toggleMember = (memberId) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedMembers(newSet);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = (contact) => {
    return contact.name || contact.username || "Unknown";
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <div className="sidebar-avatar">{getInitials(user?.name || user?.username)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">{user?.name || user?.username}</div>
              <div className="sidebar-user-status">Online</div>
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="sidebar-icon-button" onClick={() => setShowGroupModal(true)} title="New Group">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
              </svg>
            </button>
            <button className="sidebar-icon-button" onClick={logout} title="Logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <div className="sidebar-search-wrapper">
            <span className="sidebar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
          </div>
        </div>

        <div className="chat-list">
          {loading && (
            <div style={{ 
              padding: "20px", 
              textAlign: "center", 
              color: "#8696a0" 
            }}>
              Loading contacts...
            </div>
          )}
          {!loading && filteredGroups.map((group) => (
            <div
              key={group._id}
              className={`chat-item ${selectedChat?.id === group._id && selectedChat?.isGroup ? "selected" : ""}`}
              onClick={() => onSelectChat({
                id: group._id,
                name: group.name,
                isGroup: true,
                members: group.members
              })}
            >
              <div className="chat-item-avatar">{getInitials(group.name)}</div>
              <div className="chat-item-content">
                <div className="chat-item-header">
                  <span className="chat-name">{group.name}</span>
                </div>
                <div className="chat-preview">
                  {group.members?.length || 0} members
                </div>
              </div>
            </div>
          ))}

          {!loading && filteredContacts.map((contact) => (
            <div
              key={contact._id}
              className={`chat-item ${selectedChat?.id === contact._id && !selectedChat?.isGroup ? "selected" : ""}`}
              onClick={() => onSelectChat({
                id: contact._id,
                name: contact.name,
                username: contact.username,
                isGroup: false
              })}
            >
              <div className={`chat-item-avatar ${onlineUsers.has(String(contact._id || contact.id)) ? "online" : ""}`}>
                {getInitials(getUserName(contact))}
              </div>
              <div className="chat-item-content">
                <div className="chat-item-header">
                  <span className="chat-name">{getUserName(contact)}</span>
                </div>
                <div className="chat-preview">
                  {onlineUsers.has(String(contact._id || contact.id)) ? "online" : "offline"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showGroupModal && (
        <div className="group-modal" onClick={() => setShowGroupModal(false)}>
          <div className="group-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="group-modal-header">Create New Group</div>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="group-modal-input"
            />
            <div className="group-modal-members">
              {allUsers.map((member) => (
                <div
                  key={member._id}
                  className="group-modal-member"
                  onClick={() => toggleMember(member._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member._id)}
                    onChange={() => {}}
                  />
                  <div className="chat-item-avatar">{getInitials(member.name || member.username)}</div>
                  <span className="chat-name">{member.name || member.username}</span>
                </div>
              ))}
            </div>
            <div className="group-modal-actions">
              <button
                className="group-modal-button secondary"
                onClick={() => setShowGroupModal(false)}
              >
                Cancel
              </button>
              <button
                className="group-modal-button primary"
                onClick={handleCreateGroup}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
