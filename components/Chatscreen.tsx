"use client";
import React, { useEffect, useRef, useState } from "react";
import { BiSend } from "react-icons/bi";
import { v4 as uuidv4 } from "uuid";
import MessageHistory from "./MessageHistory";
import LandingPage from "./LandingPage";
import { AxiosResponse } from "axios";

type ChatscreenProps = {
  showSideBar: boolean;
  handleShowSideBar: (showSideBar: boolean) => any;
  generateQuestions: () => Promise<AxiosResponse<any, any>>;
};

export type TMessage = {
  ai: string;
  user: string;
  messageId: string;
};

export type TQuestions = {
  header: string;
  questions: Array<string>;
  type: string;
};

const initState: Array<TMessage> = [{ ai: "", user: "", messageId: "" }];
const Chatscreen: React.FC<ChatscreenProps> = ({
  showSideBar,
  generateQuestions,
}: Readonly<ChatscreenProps>) => {
  const [message, setMessage] = useState<string>("");
  const [messageHistory, setMessageHistory] =
    useState<Array<TMessage>>(initState);

  const [disabled, setDisabled] = useState(message.length === 0);

  const [generatedQuestions, setGeneratedQuestions] = useState({});

  useEffect(() => {
    async function fetchData() {
      const questions = await generateQuestions();

      console.log({ questions });

      setGeneratedQuestions(questions);
    }

    fetchData();
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

  const handleSend = () => {
    const newMessage: TMessage = {
      ai: "",
      user: `${message}`,
      messageId: uuidv4(),
    };

    setMessageHistory((prev: Array<TMessage>) => [...prev, newMessage]);
    setMessage("");
    setDisabled(true);
  };

  return (
    <div className={`z-10 bg-slate-700 ${showSideBar ? "w-4/5" : "w-screen"}`}>
      {messageHistory.length === 1 ? (
        <LandingPage questions={generatedQuestions as TQuestions} />
      ) : (
        <MessageHistory messageHistory={messageHistory} />
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
