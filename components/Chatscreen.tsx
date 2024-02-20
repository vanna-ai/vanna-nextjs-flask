"use client";
import React, {
  useLayoutEffect,
  useState,
  KeyboardEvent,
  useCallback,
} from "react";
import { BiSend } from "react-icons/bi";
import { v4 as uuidv4 } from "uuid";
import MessageHistory from "./MessageHistory";
import Homescreen from "./Homescreen";
import {
  SQLResponse,
  TMessage,
  TQuestions,
  RUNResponse,
} from "@/helpers/types";
import { AxiosResponse } from "axios";
import { MESSAGE_TYPES } from "@/helpers/enums";
import { useRoot } from "@/context/ContextProvider";

type ChatscreenProps = {
  generateQuestions: () => Promise<AxiosResponse<any, any>>;
  generateSQL: (question: string) => Promise<SQLResponse>;
  runSQL: (sql: string) => Promise<RUNResponse>;
};

const Chatscreen: React.FC<ChatscreenProps> = ({
  generateQuestions,
  generateSQL,
  runSQL,
}: Readonly<ChatscreenProps>) => {
  const [message, setMessage] = useState<string>("");

  const { showSideBar, messageHistory, handleChangeMessageHistory } = useRoot();

  const [disabled, setDisabled] = useState(message.length === 0);
  const [loading, setLoading] = useState(true);
  const [generatedQuestions, setGeneratedQuestions] = useState({});

  useLayoutEffect(() => {
    let isMounted = true; // Flag to track component's mounting status

    async function fetchData() {
      let questions = await generateQuestions();
      if (isMounted) {
        // Only update state if component is still mounted
        console.log({ questions });
        setGeneratedQuestions(questions);
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false; // Set flag to false when the component unmounts
    };
  }, [generateQuestions]);

  const handleInputChange = (e: { target: { value: string } }) => {
    if (e.target.value.length > 0) {
      setMessage(e.target.value);
      setDisabled(false);
    } else {
      setMessage("");
      setDisabled(true);
    }
  };

  const handleSend = useCallback(async () => {
    if (message.length === 0) return; // Guard clause to prevent sending empty messages

    try {
      const newMessageId = uuidv4();

      const msg = message.slice();
      setMessage("");
      setDisabled(true);
      let newMessage: TMessage = {
        ai: "",
        user: msg,
        messageId: newMessageId,
        type: MESSAGE_TYPES.user,
      };

      handleChangeMessageHistory(newMessage);

      const aiRes = await generateSQL(msg);
      console.log({ aiRes });

      if (aiRes.text === "No SELECT statement could be found in the SQL code") {
        newMessage = {
          ai: aiRes.text,
          user: "",
          messageId: uuidv4(),
          type: MESSAGE_TYPES.error,
        };
      } else {
        newMessage = {
          ai: aiRes.text,
          user: "",
          messageId: uuidv4(),
          type: MESSAGE_TYPES.sql,
        };
      }

      handleChangeMessageHistory(newMessage);
    } catch (error: any) {
      console.error("Failed to handle send:", error);
      // Handle the error state appropriately
    }
  }, [message, handleChangeMessageHistory, generateSQL]); // Dependencies

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" && !disabled) {
      handleSend();
      event.preventDefault(); // Prevent the default action to avoid submitting a form if it's part of one
    }
  };

  return (
    <div className={`z-10 bg-slate-700 ${showSideBar ? "w-4/5" : "w-screen"}`}>
      {messageHistory.length === 1 ? (
        <Homescreen
          questions={generatedQuestions as TQuestions}
          generateSQL={generateSQL}
          loading={loading}
        />
      ) : (
        <MessageHistory runSQL={runSQL} />
      )}
      <div
        className={`z-10 fixed bottom-0 border-2 border-gray-800 p-2 mt-2 rounded-2xl m-8 ${
          showSideBar ? "w-[73vw]" : "w-11/12"
        }`}
      >
        <div className={`input-group flex`}>
          <input
            type="text"
            className="input m-2 w-full bg-transparent border-none outline-none"
            placeholder="Type your question..."
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          <button
            disabled={disabled}
            className={`btn btn-square p-2 border rounded-xl ${
              disabled
                ? "border border-slate-800 bg-slate-800"
                : "border-white bg-white"
            }`}
          >
            <BiSend size={25} onClick={handleSend} className="text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatscreen;
