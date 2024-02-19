"use client";
import React, { useEffect, useState, KeyboardEvent } from "react";
import { BiSend } from "react-icons/bi";
import { v4 as uuidv4 } from "uuid";
import MessageHistory from "./MessageHistory";
import LandingPage from "./LandingPage";
import {
  SQLResponse,
  TMessage,
  TQuestions,
  RUNResponse,
} from "@/helpers/types";
import { AxiosResponse } from "axios";
import { MESSAGE_TYPES } from "@/helpers/enums";

type ChatscreenProps = {
  showSideBar: boolean;
  handleShowSideBar: (showSideBar: boolean) => any;
  generateQuestions: () => Promise<AxiosResponse<any, any>>;
  generateSQL: (question: string) => Promise<SQLResponse>;
  runSQL: (sql: string) => Promise<RUNResponse>;
};

const initState: Array<TMessage> = [
  { ai: "", user: "", messageId: "", type: "" },
];
const Chatscreen: React.FC<ChatscreenProps> = ({
  showSideBar,
  generateQuestions,
  generateSQL,
  runSQL,
}: Readonly<ChatscreenProps>) => {
  const [message, setMessage] = useState<string>("");
  const [messageHistory, setMessageHistory] =
    useState<Array<TMessage>>(initState);

  const [disabled, setDisabled] = useState(message.length === 0);
  const [loading, setLoading] = useState(true);
  const [generatedQuestions, setGeneratedQuestions] = useState({});

  useEffect(() => {
    async function fetchData() {
      let questions = await generateQuestions();
      console.log({ questions });
      setGeneratedQuestions(questions);
      setLoading(false);
    }

    if (messageHistory.length === 1) {
      fetchData();
    }
  }, [generateQuestions, messageHistory]);

  const handleInputChange = (e: { target: { value: string } }) => {
    if (e.target.value.length > 0) {
      setMessage(e.target.value);
      setDisabled(false);
    } else {
      setMessage("");
      setDisabled(true);
    }
  };

  const handleSend = async () => {
    let newMessage: TMessage = {
      ai: "",
      user: `${message}`,
      messageId: uuidv4(),
      type: MESSAGE_TYPES.user,
    };

    setMessageHistory((prev: Array<TMessage>) => [...prev, newMessage]);
    setMessage("");
    setDisabled(true);

    const aiRes = await generateSQL(message);
    console.log({ aiRes });
    newMessage = {
      ai: aiRes.text,
      user: "",
      messageId: uuidv4(),
      type: MESSAGE_TYPES.sql,
    };

    setMessageHistory((prev: Array<TMessage>) => [...prev, newMessage]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" && !disabled) {
      handleSend();
      event.preventDefault(); // Prevent the default action to avoid submitting a form if it's part of one
    }
  };

  return (
    <div className={`z-10 bg-slate-700 ${showSideBar ? "w-4/5" : "w-screen"}`}>
      {messageHistory.length === 1 ? (
        <LandingPage
          questions={generatedQuestions as TQuestions}
          setMessageHistory={setMessageHistory}
          generateSQL={generateSQL}
          loading={loading}
        />
      ) : (
        <MessageHistory
          messageHistory={messageHistory}
          runSQL={runSQL}
          setMessageHistory={setMessageHistory}
        />
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
