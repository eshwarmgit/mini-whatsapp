import "../styles/message.css";

export default function ChatHeader({ name, info, typingText, isConnected = true }) {
  return (
    <div className="chat-header" style={{
      background: "#202c33",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #2a3942",
      minHeight: "59px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#00a884",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "600",
          fontSize: "18px"
        }}>
          {name ? name.charAt(0).toUpperCase() : "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: "#e9edef",
            fontSize: "16px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {name || "Chat"}
          </div>
          <div style={{
            color: "#8696a0",
            fontSize: "13px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            {!isConnected && <span style={{ color: "#f15c6d" }}>⚠️ Disconnected</span>}
            {isConnected && (typingText || (info?.online ? "online" : info?.members ? `${info.members} members` : "offline"))}
          </div>
        </div>
      </div>
    </div>
  );
}

