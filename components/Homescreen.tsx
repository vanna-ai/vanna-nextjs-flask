import React from "react";
import Image from "next/image";
import { SQLResponse, TMessage, TQuestions } from "@/helpers/types";
import { v4 as uuidv4 } from "uuid";
import { MESSAGE_TYPES } from "@/helpers/enums";
import { useRoot } from "@/context/ContextProvider";

type HomescreenProps = {
  questions: TQuestions;
  generateSQL: (question: string) => Promise<SQLResponse>;
  loading: boolean;
};
const Homescreen = (props: HomescreenProps) => {
  const { questions, generateSQL, loading } = props;

  const { handleChangeMessageHistory } = useRoot();

  const handleSelectQuestion = async (value: string) => {
    try {
      let newMessage: TMessage = {
        ai: "",
        user: value,
        messageId: uuidv4(),
        type: MESSAGE_TYPES.user,
      };
      handleChangeMessageHistory(newMessage);

      let SQL = await generateSQL(value);

      const { text } = SQL;
      newMessage = {
        ai: text,
        user: "",
        messageId: uuidv4(),
        type: MESSAGE_TYPES.sql,
      };

      handleChangeMessageHistory(newMessage);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <div className="m-2 flex flex-col w-full h-full l items-center justify-center">
      <div className="w-20 h-20 p-2 m-2 rounded-full bg-black flex items-center justify-center">
        <Image
          className={`logo`}
          alt={"SQLAI"}
          src={"/assets/vanna_circle.png"}
          width={200}
          height={200}
        />
      </div>
      <p className="font-bold p-2 m-2">Talk to your data!</p>

      <div className="flex flex-col justify-start items-start max-h-[54vh] overflow-y-scroll">
        <p>{questions && "header" in questions && questions?.header}</p>
        {!loading &&
          questions?.questions?.map((ques: string) => {
            return (
              <button
                className="border border-1 m-2 p-2 rounded-lg"
                key={uuidv4()}
                onClick={() => handleSelectQuestion(ques)}
              >
                {ques}
              </button>
            );
          })}
        {loading && <div>Loading....</div>}
      </div>
    </div>
  );
};

export default Homescreen;
