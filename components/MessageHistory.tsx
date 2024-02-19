"use client";
import React, { useState, Dispatch, SetStateAction } from "react";
import ChatBubble from "./ChatBubble";
import { TMessage, RUNResponse } from "@/helpers/types";
import { MESSAGE_TYPES, MODES } from "@/helpers/enums";
import Button from "./Button";
import { v4 as uuidV4 } from "uuid";
import Table from "./Table";
import Swal from "sweetalert2";

type MessageHistoryProps = {
  messageHistory: Array<TMessage>;
  setMessageHistory: Dispatch<SetStateAction<TMessage[]>>;
  runSQL: (sql: string) => Promise<RUNResponse>;
};

const MessageHistory = (props: MessageHistoryProps) => {
  const { messageHistory, setMessageHistory, runSQL } = props;
  const [mode, setMode] = useState(MODES.run);

  const handleModeChange = (value: string) => {
    setMode(value);
  };

  const handleRunClick = async (val: TMessage) => {
    try {
      handleModeChange(MODES.run);
      let dfResponse = await runSQL(val.ai);

      let newMessage: TMessage = {
        ai: dfResponse.df,
        user: "",
        messageId: uuidV4(),
        type: MESSAGE_TYPES.df,
      };

      setMessageHistory((prev: Array<TMessage>) => [...prev, newMessage]);
    } catch (error: any) {
      Swal.fire({
        title: "Error!",
        text: error,
        icon: "error",
        confirmButtonText: "Ok",
      });
    }
  };

  const handleEditClick = () => {
    handleModeChange(MODES.edit);
  };

  const handleSaveClick = () => {
    handleModeChange(MODES.run);
  };

  return (
    <div className="p-2 m-4 max-h-[80vh] overflow-y-scroll">
      {messageHistory.map((val) => (
        <div key={val.messageId}>
          {val.ai && (
            <div className="flex flex-col items-start justify-center">
              <ChatBubble
                value={val.ai}
                title="Vanna"
                logo={"/assets/vanna_circle.png"}
                alt="red"
                mode={mode}
                child={
                  mode === MODES.edit ? (
                    <textarea
                      className="flex text-black w-[30rem] h-[15rem] font-bold text-sm rounded p-1"
                      value={val.ai}
                      onChange={() => console.log("Hi")}
                    />
                  ) : val.type === MESSAGE_TYPES.df ? (
                    <Table dataString={val.ai} />
                  ) : null
                }
              />

              {val.type === MESSAGE_TYPES.sql && (
                <div className="flex flex-row items-center justify-center gap-4 ml-24">
                  {mode === MODES.run ? (
                    <>
                      <Button
                        text={MODES.run}
                        className=""
                        handleClick={() => handleRunClick(val)}
                      />
                      <Button
                        text={MODES.edit}
                        className=""
                        handleClick={handleEditClick}
                      />
                    </>
                  ) : (
                    <Button
                      text="Save"
                      className=""
                      handleClick={handleSaveClick}
                    />
                  )}
                </div>
              )}
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
