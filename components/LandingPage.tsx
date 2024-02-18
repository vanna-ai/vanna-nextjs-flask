import React from "react";
import Image from "next/image";
import { TQuestions } from "./Chatscreen";
import { v4 as uuidv4 } from "uuid";

type LandingPageProps = {
  questions: TQuestions;
};
const LandingPage = (props: LandingPageProps) => {
  const { questions } = props;
  return (
    <div className="flex flex-col w-full h-[90%] items-center justify-center">
      <div className="w-20 h-20 rounded-full p-0 m-0 bg-black flex items-center justify-center">
        <Image
          className={`logo p-0 m-0`}
          alt={"SQLAI"}
          src={"/assets/vanna_circle.png"}
          width={200}
          height={200}
        />
      </div>
      <text className="font-bold p-2 m-2">Talk to your data!</text>

      <div className="flex flex-col justify-start items-start">
        <text>{questions && "header" in questions && questions.header}</text>
        {questions &&
          "questions" in questions &&
          questions.questions.map((ques: string) => {
            return (
              <button
                className="border border-1 m-2 p-2 rounded-lg"
                key={uuidv4()}
              >
                {ques}
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default LandingPage;
