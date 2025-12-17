import { useState, useRef, useEffect } from "react";
import "../styles/message.css";

export default function MessageInput({ onSend, onDelete, socket, selectedChat }) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      if (selectedChat) {
        socket?.emit("typing-start", {
          chatId: selectedChat.id,
          isGroup: selectedChat.isGroup
        });
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedChat) {
        socket?.emit("typing-stop", {
          chatId: selectedChat.id,
          isGroup: selectedChat.isGroup
        });
      }
    }, 1000);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    onSend(message.trim());
    setMessage("");

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      if (selectedChat) {
        socket?.emit("typing-stop", {
          chatId: selectedChat.id,
          isGroup: selectedChat.isGroup
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && selectedChat) {
        socket?.emit("typing-stop", {
          chatId: selectedChat.id,
          isGroup: selectedChat.isGroup
        });
      }
    };
  }, [selectedChat]);

  return (
    <div className="input-bar">
      <div className="input-wrapper">
        <button className="emoji-button" title="Emoji">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-1.5-3c.83 0 1.5-.67 1.5-1.5S11.33 8 10.5 8 9 8.67 9 9.5 9.67 11 10.5 11zm5 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z"/>
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder="Type a message"
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          rows={1}
        />
      </div>
      <button
        className="send-button"
        onClick={handleSend}
        disabled={!message.trim()}
        title="Send"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  );
}
