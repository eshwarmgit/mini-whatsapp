import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { authAPI, chatAPI, groupAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import "../styles/chat.css";

export default function Chat() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Load contacts and groups
  useEffect(() => {
    loadContacts();
    loadGroups();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      console.warn("Socket not available");
      return;
    }

    console.log("Setting up socket listeners, socket connected:", socket.connected);

    // Error handler
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      if (error.message) {
        alert(`Error: ${error.message}`);
      }
    });

    // 1-to-1 messages
    socket.on("receive-message", (message) => {
      const senderId = String(message.sender?._id || message.sender || "");
      const receiverId = String(message.receiver?._id || message.receiver || "");
      const chatId = String(selectedChat?.id || "");
      
      if (
        selectedChat &&
        !selectedChat.isGroup &&
        (senderId === chatId || receiverId === chatId)
      ) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(m => String(m._id) === String(message._id));
          if (exists) return prev;
          return [...prev, message];
        });
      }
    });

    socket.on("message-sent", (message) => {
      const receiverId = String(message.receiver?._id || message.receiver || "");
      const chatId = String(selectedChat?.id || "");
      
      if (
        selectedChat &&
        !selectedChat.isGroup &&
        receiverId === chatId
      ) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(m => String(m._id) === String(message._id));
          if (exists) return prev;
          return [...prev, message];
        });
      }
    });

    // Group messages
    socket.on("receive-group-message", (message) => {
      const groupId = String(message.groupId || "");
      const chatId = String(selectedChat?.id || "");
      
      if (selectedChat && selectedChat.isGroup && groupId === chatId) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(m => String(m._id) === String(message._id));
          if (exists) return prev;
          return [...prev, message];
        });
      }
    });

    // Typing indicators
    socket.on("user-typing", (data) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.chatId]: data.isTyping
          ? { ...prev[data.chatId], [data.userId]: data.username }
          : { ...prev[data.chatId], [data.userId]: undefined }
      }));
    });

    // Online/offline status
    socket.on("user-online", (data) => {
      setOnlineUsers((prev) => new Set([...prev, String(data.userId)]));
    });

    socket.on("user-offline", (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(String(data.userId));
        return newSet;
      });
    });

    // Message deletion
    socket.on("message-deleted", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                content: "This message was deleted",
                isDeleted: true,
                deletedForEveryone: data.deletedFor === "everyone"
              }
            : msg
        )
      );
    });

    return () => {
      socket.off("receive-message");
      socket.off("message-sent");
      socket.off("receive-group-message");
      socket.off("user-typing");
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("message-deleted");
      socket.off("error");
    };
  }, [socket, selectedChat]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessages();
      if (selectedChat.isGroup) {
        socket?.emit("join-group", selectedChat.id);
      }
    }

    return () => {
      if (selectedChat?.isGroup) {
        socket?.emit("leave-group", selectedChat.id);
      }
    };
  }, [selectedChat, socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await authAPI.getUsers();
      const currentUserId = String(user._id || user.id || "");
      const allUsers = response.data.filter((u) => {
        const userId = String(u._id || u.id || "");
        return userId !== currentUserId;
      });
      setContacts(allUsers);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      alert("Failed to load contacts. Please refresh the page.");
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getMyGroups();
      setGroups(response.data);
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat) return;
    
    setLoadingMessages(true);
    try {
      let response;
      if (selectedChat.isGroup) {
        response = await groupAPI.getGroupMessages(selectedChat.id);
      } else {
        response = await chatAPI.getMessages(selectedChat.id);
      }
      setMessages(response.data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      alert("Failed to load messages. Please try again.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessages([]);
  };

  const handleSendMessage = async (content) => {
    if (!selectedChat || !content.trim()) return;

    try {
      // Try socket first, fallback to API if socket not connected
      if (socket && socket.connected) {
        if (selectedChat.isGroup) {
          socket.emit("send-group-message", {
            groupId: selectedChat.id,
            content
          });
        } else {
          socket.emit("send-message", {
            receiver: selectedChat.id,
            content
          });
        }
      } else {
        // Fallback to API if socket not available
        if (selectedChat.isGroup) {
          // For groups, we still need socket, so show error
          alert("Socket not connected. Please refresh the page.");
        } else {
          // Use API for 1-to-1 messages
          const response = await chatAPI.sendMessage(selectedChat.id, content);
          setMessages((prev) => [...prev, response.data]);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone) => {
    try {
      if (deleteForEveryone) {
        socket?.emit("delete-message-for-everyone", { messageId });
        await chatAPI.deleteForEveryone(messageId);
      } else {
        socket?.emit("delete-message-for-me", { messageId });
        await chatAPI.deleteForMe(messageId);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleCreateGroup = async (name, memberIds) => {
    try {
      const response = await groupAPI.create(name, memberIds);
      setGroups((prev) => [response.data, ...prev]);
      handleSelectChat({
        id: response.data._id,
        name: response.data.name,
        isGroup: true,
        members: response.data.members
      });
    } catch (error) {
      console.error("Failed to create group:", error);
      alert(error.response?.data?.error || "Failed to create group");
    }
  };

  const getChatName = () => {
    if (!selectedChat) return "";
    return selectedChat.name || selectedChat.username || "Chat";
  };

  const getChatInfo = () => {
    if (!selectedChat) return null;
    if (selectedChat.isGroup) {
      return {
        name: selectedChat.name,
        members: selectedChat.members?.length || 0
      };
    }
    return {
      name: selectedChat.name || selectedChat.username,
      online: onlineUsers.has(String(selectedChat.id))
    };
  };

  const getTypingText = () => {
    if (!selectedChat) return "";
    const chatId = selectedChat.id;
    const typing = typingUsers[chatId];
    if (!typing) return "";

    const typingList = Object.values(typing).filter(Boolean);
    if (typingList.length === 0) return "";

    if (typingList.length === 1) {
      return `${typingList[0]} is typing...`;
    }
    return "Several people are typing...";
  };

  return (
    <div className="chat-container">
      <Sidebar
        contacts={contacts}
        groups={groups}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        onCreateGroup={handleCreateGroup}
        onlineUsers={onlineUsers}
        loading={loadingContacts}
      />

      <div className="chat-main">
        {selectedChat ? (
          <>
            <ChatHeader
              name={getChatName()}
              info={getChatInfo()}
              typingText={getTypingText()}
              isConnected={isConnected}
            />

            {loadingMessages ? (
              <div style={{ 
                flex: 1, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "#8696a0"
              }}>
                Loading messages...
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={user._id || user.id}
                messagesEndRef={messagesEndRef}
                onDelete={handleDeleteMessage}
              />
            )}

            <MessageInput
              onSend={handleSendMessage}
              onDelete={handleDeleteMessage}
              socket={socket}
              selectedChat={selectedChat}
            />
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <div className="whatsapp-icon">💬</div>
              <h2>WhatsApp Web</h2>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
