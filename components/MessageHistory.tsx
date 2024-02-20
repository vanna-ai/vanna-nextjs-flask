"use client";
import React, { useState, useCallback, ChangeEvent } from "react";
import ChatBubble from "./ChatBubble";
import { TMessage, RUNResponse } from "@/helpers/types";
import { MESSAGE_TYPES, MODES } from "@/helpers/enums";
import { v4 as uuidV4 } from "uuid";
import Table from "./Table";
import { useRoot } from "@/context/ContextProvider";
import ChatButtons from "./ChatButtons";
import useChatScroll from "./ChatScroll";

type MessageHistoryProps = {
  runSQL: (sql: string) => Promise<RUNResponse>;
};

const MessageHistory = (props: MessageHistoryProps) => {
  const { runSQL } = props;
  const [mode, setMode] = useState(MODES.run);

  const { messageHistory, handleChangeMessageHistory } = useRoot();
  const chatRef = useChatScroll(messageHistory);

  const handleModeChange = useCallback((value: string) => {
    setMode(value);
  }, []);

  const [currSQL, setCurrSQL] = useState("");

  const handleRunClick = useCallback(
    async (val: TMessage) => {
      try {
        handleModeChange(MODES.run);
        let dfResponse = await runSQL(val.ai);

        let newMessage: TMessage = {
          ai: dfResponse.df,
          user: "",
          messageId: uuidV4(),
          type: MESSAGE_TYPES.df,
        };

        handleChangeMessageHistory(newMessage);
      } catch (error: any) {
        console.error(error);
      }
    },
    [handleModeChange, runSQL, handleChangeMessageHistory]
  );

  const handleEditClick = () => {
    handleModeChange(MODES.edit);
  };

  const handleSaveClick = useCallback(
    (ix: number) => {
      handleModeChange(MODES.run);

      const newMessageHistory = messageHistory.map((msg, index): TMessage => {
        console.log("ixid", ix, index);
        return index === ix ? { ...msg, ai: currSQL } : msg;
      });

      handleChangeMessageHistory(undefined, newMessageHistory);
    },
    [handleModeChange, handleChangeMessageHistory, messageHistory, currSQL]
  ); // Dependencies

  const renderChild = (val: TMessage) => {
    const handleChangeSQL = (e: ChangeEvent<HTMLTextAreaElement>): void => {
      setCurrSQL(e.target.value);
    };

    if (mode === MODES.edit) {
      return (
        <textarea
          className="flex text-black w-[30rem] h-[15rem] font-bold text-sm rounded p-1"
          defaultValue={val.ai}
          onChange={handleChangeSQL}
        />
      );
    } else if (val.type === MESSAGE_TYPES.df) {
      const data = JSON.parse(val.ai);
      if (Array.isArray(data) && data.length === 0) {
        return <p className="font-bold text-base">Relevant data not found!</p>;
      } else {
        return <Table data={data} />;
      }
    } else {
      return null;
    }
  };

  return (
    <div ref={chatRef} className="p-2 m-4 max-h-[80vh] overflow-y-scroll">
      {messageHistory.map((val, ix) => (
        <div key={val.messageId}>
          {val.ai && (
            <div className="flex flex-col items-start justify-center">
              <ChatBubble
                value={val.ai}
                title="Vanna"
                logo={"/assets/vanna_circle.png"}
                alt="red"
                child={renderChild(val)}
              />

              <ChatButtons
                currentIndex={ix}
                messageHistory={messageHistory}
                value={val}
                mode={mode}
                handleRunClick={handleRunClick}
                handleEditClick={handleEditClick}
                handleSaveClick={handleSaveClick}
              />
            </div>
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
