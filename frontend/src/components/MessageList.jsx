import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "../styles/message.css";

export default function MessageList({ messages, currentUserId, messagesEndRef, onDelete }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messagesEndRef]);

  return (
    <div className="message-list" ref={listRef}>
      {messages.map((message) => (
        <MessageBubble
          key={message._id}
          message={message}
          isMine={(message.sender?._id || message.sender) === currentUserId}
          onDelete={onDelete}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
