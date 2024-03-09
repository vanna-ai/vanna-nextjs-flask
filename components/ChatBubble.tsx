import React, { ReactNode } from "react";
import Avatar from "./Avatar";

type ChatBubbleProps = {
  title: string;
  logo: string;
  alt: string;
  child?: ReactNode;
};

const ChatBubble: React.FC<ChatBubbleProps> = (props: ChatBubbleProps) => {
  const { logo, title, alt, child } = props;
  return (
    <div className="chat-message my-4">
      <div className="flex items-end my-2">
        <Avatar className="avatar" path={logo} alt={alt} />
        <p className="mx-2 font-bold text-base text-gray-500">{title}</p>
      </div>
      <div className="flex flex-col space-y-2 text-xs ml-10 mr-2 my-2 max-w-[70rem] min-w-[20rem] overflow-x-scroll rounded-lg">
        {child}
      </div>
    </div>
  );
};

export default ChatBubble;
