import React from "react";
import Avatar from "./Avatar";

type ChatBubbleProps = {
  title: string;
  logo: string;
  value: string;
  alt: string;
};

const ChatBubble: React.FC<ChatBubbleProps> = (props: ChatBubbleProps) => {
  const { logo, title, value, alt } = props;
  return (
    <div className="chat-message my-4">
      <div className="flex items-end my-2">
        <Avatar className="avatar" path={logo} alt={alt} />
        <text className="mx-2 font-bold text-base text-gray-500">{title}</text>
      </div>
      <div className="flex flex-col space-y-2 text-xs max-w-xs ml-10 mr-2 my-2">
        <div className="font-bold text-base">{value}</div>
      </div>
    </div>
  );
};

export default ChatBubble;
