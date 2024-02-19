import React, { ReactNode } from "react";
import Avatar from "./Avatar";
import { MODES } from "@/helpers/enums";

type ChatBubbleProps = {
  title: string;
  logo: string;
  value: string;
  alt: string;
  mode?: string;
  child?: ReactNode;
};

const ChatBubble: React.FC<ChatBubbleProps> = (props: ChatBubbleProps) => {
  const { logo, title, value, alt, mode, child } = props;
  return (
    <div className="chat-message my-4">
      <div className="flex items-end my-2">
        <Avatar className="avatar" path={logo} alt={alt} />
        <p className="mx-2 font-bold text-base text-gray-500">{title}</p>
      </div>
      <div className="flex flex-col space-y-2 text-xs max-w-xs ml-10 mr-2 my-2">
        {child ?? (
          <div className="font-bold text-base">{value}</div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
