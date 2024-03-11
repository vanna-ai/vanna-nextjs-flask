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
import CodeContainer from "./CodeContainer";

type MessageHistoryProps = {
  runSQL: (sql: string) => Promise<RUNResponse>;
};
type ModesState = {
  [key: number]: string;
};

const MessageHistory = (props: MessageHistoryProps) => {
  const { runSQL } = props;
  const [modes, setModes] = useState<ModesState>({});

  const { messageHistory, handleChangeMessageHistory } = useRoot();
  const chatRef = useChatScroll(messageHistory);

  const handleModeChange = useCallback((ix: number, value: string) => {
    setModes((prevModes) => ({ ...prevModes, [ix]: value }));
  }, []);

  const [currSQL, setCurrSQL] = useState("");

  const handleRunClick = useCallback(
    async (val: TMessage, ix: number) => {
      try {
        handleModeChange(ix, MODES.run);
        let dfResponse = await runSQL(val.ai);
        let newMessage: TMessage = {
          ai: dfResponse?.df,
          user: "",
          messageId: uuidV4(),
          type: MESSAGE_TYPES.df,
        };

        if ("error" in dfResponse) {
          newMessage = {
            ai: dfResponse.error as string,
            user: "",
            messageId: uuidV4(),
            type: MESSAGE_TYPES.error,
          };
        }

        handleChangeMessageHistory(newMessage);
      } catch (error: any) {
        console.error(error);
      }
    },
    [handleModeChange, runSQL, handleChangeMessageHistory]
  );

  const handleEditClick = (ix: number) => {
    handleModeChange(ix, MODES.edit);
  };

  const handleSaveClick = useCallback(
    (ix: number) => {
      handleModeChange(ix, MODES.run);

      if (currSQL.length > 0) {
        const newMessageHistory = messageHistory.map((msg, index): TMessage => {
          console.log("ixid", ix, index);
          return index === ix ? { ...msg, ai: currSQL } : msg;
        });
        handleChangeMessageHistory(undefined, newMessageHistory);
      }
    },
    [handleModeChange, handleChangeMessageHistory, messageHistory, currSQL]
  );

  const renderChild = (val: TMessage, ix: number) => {
    const handleChangeSQL = (e: ChangeEvent<HTMLTextAreaElement>): void => {
      e.preventDefault();
      const value = e.target.value;
      setCurrSQL(value);
    };

    const mode = modes[ix] || MODES.run;

    if (mode === MODES.edit) {
      return (
        <textarea
          className="flex p-6 text-white bg-gray-800 w-[50vw] min-h-48 font-base text-sm rounded"
          defaultValue={val.ai}
          onChange={handleChangeSQL}
        />
      );
    } else if (val.type === MESSAGE_TYPES.df) {
      const data = JSON.parse(val.ai);
      if (Array.isArray(data) && data.length === 0) {
        return <p className="font-bold text-xs">Relevant data not found!</p>;
      } else {
        return <Table data={data} />;
      }
    } else if (val.type === MESSAGE_TYPES.sql) {
      return <CodeContainer language="sql">{val.ai}</CodeContainer>;
    } else {
      const isAi = [MESSAGE_TYPES.error, MESSAGE_TYPES.ai].includes(val.type);
      const value = isAi ? val.ai : val.user;

      return <div className="font-normal text-base">{value}</div>;
    }
  };

  return (
    <div ref={chatRef} className="p-2 m-4 max-h-[80vh] overflow-y-scroll">
      {messageHistory?.map((val, ix) => (
        <div key={val?.messageId}>
          {val?.ai && (
            <div className="flex flex-col items-start justify-center">
              <ChatBubble
                title="Vanna"
                logo={"/assets/vanna_circle.png"}
                alt="red"
                child={renderChild(val, ix)}
              />

              <ChatButtons
                currentIndex={ix}
                messageHistory={messageHistory}
                value={val}
                mode={modes[ix] || MODES.run}
                handleRunClick={handleRunClick}
                handleEditClick={handleEditClick}
                handleSaveClick={handleSaveClick}
              />
            </div>
          )}

          {val?.user && (
            <ChatBubble
              title="User"
              logo={"/assets/user.png"}
              alt="blue"
              child={renderChild(val, ix)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageHistory;
