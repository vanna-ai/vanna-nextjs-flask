import React from "react";
import ChatBubble from "./ChatBubble";
import { TMessage } from "./Chatscreen";

type Props = {
  messageHistory: Array<TMessage>;
};

const MessageHistory = (props: Props) => {
  const { messageHistory } = props;
  return (
    <div className="p-2 m-4">
      {messageHistory.map((val) => (
        <div key={val.messageId}>
          {val.ai && (
            <ChatBubble
              value={val.ai}
              title="Vanna"
              logo={"/assets/vanna_circle.png"}
              alt="red"
            />
          )}

          {val.user && (
            <ChatBubble
              value={val.user}
              title="User"
              logo={"/assets/user.png"}
              alt="blue"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageHistory;
