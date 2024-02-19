import React, { SetStateAction, Dispatch } from "react";
import Image from "next/image";
import { SQLResponse, TMessage, TQuestions } from "@/helpers/types";
import { v4 as uuidv4 } from "uuid";
import { MESSAGE_TYPES } from "@/helpers/enums";

type LandingPageProps = {
  questions: TQuestions;
  setMessageHistory: Dispatch<SetStateAction<TMessage[]>>;
  generateSQL: (question: string) => Promise<SQLResponse>;
  loading: boolean;
};
const LandingPage = (props: LandingPageProps) => {
  const { questions, setMessageHistory, generateSQL, loading } = props;

  const handleSelectQuestion = async (value: string) => {
    let newMessage: TMessage = {
      ai: "",
      user: value,
      messageId: uuidv4(),
      type: MESSAGE_TYPES.user,
    };
    setMessageHistory((prev: Array<TMessage>) => [...prev, newMessage]);

    let SQL = await generateSQL(value);
    console.log({ SQL });

    const { text } = SQL;
    newMessage = {
      ai: text,
      user: "",
      messageId: uuidv4(),
      type: MESSAGE_TYPES.sql,
    };

    setMessageHistory((prev: Array<TMessage>) => [...prev, newMessage]);
  };

  return (
    <div className="flex flex-col w-full h-[90%] items-center justify-center">
      <div className="w-20 h-20 rounded-full p-0 m-0 bg-black flex items-center justify-center">
        <Image
          className={`logo p-0 m-0`}
          alt={"SQLAI"}
          src={"/assets/vanna_circle.png"}
          width={200}
          height={200}
          priority
        />
      </div>
      <p className="font-bold p-2 m-2">Talk to your data!</p>

      <div className="flex flex-col justify-start items-start">
        <p>{questions && "header" in questions && questions.header}</p>
        {!loading ? (
          questions.questions.map((ques: string) => {
            return (
              <button
                className="border border-1 m-2 p-2 rounded-lg"
                key={uuidv4()}
                onClick={() => handleSelectQuestion(ques)}
              >
                {ques}
              </button>
            );
          })
        ) : (
          <div>Loading....</div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
