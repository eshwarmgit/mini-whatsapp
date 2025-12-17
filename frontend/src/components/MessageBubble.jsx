import { useState, useRef, useEffect } from "react";
import "../styles/message.css";

export default function MessageBubble({ message, isMine, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleDelete = (deleteForEveryone) => {
    if (onDelete) {
      onDelete(message._id, deleteForEveryone);
    }
    setShowMenu(false);
  };

  const isDeleted = message.isDeleted || message.deletedForEveryone || message.content === "This message was deleted";

  return (
    <div className={`bubble-row ${isMine ? "right" : "left"}`}>
      <div
        className={`message-bubble ${isMine ? "mine" : "other"} ${isDeleted ? "deleted" : ""}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(true);
        }}
      >
        <div className="message-content">{message.content}</div>
        <div className="message-footer">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {isMine && !isDeleted && (
            <div className="message-actions" ref={menuRef}>
              <button
                className="message-menu-button"
                onClick={() => setShowMenu(!showMenu)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              {showMenu && (
                <div className="message-menu">
                  <button
                    className="message-menu-item"
                    onClick={() => handleDelete(false)}
                  >
                    Delete for me
                  </button>
                  <button
                    className="message-menu-item danger"
                    onClick={() => handleDelete(true)}
                  >
                    Delete for everyone
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
