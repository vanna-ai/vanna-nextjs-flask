"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Chatscreen from "./Chatscreen";
import { AxiosResponse } from "axios";
import { RUNResponse, SQLResponse } from "@/helpers/types";

type FunctionProps = {
  generateQuestions: () => Promise<AxiosResponse<any, any>>;
  generateSQL: (question: string) => Promise<SQLResponse>;
  runSQL: (sql: string) => Promise<RUNResponse>;
};

const Dashboard: React.FC<FunctionProps> = (props: FunctionProps) => {
  const [showSideBar, setShowSideBar] = useState(true);
  const handleShowSideBar = (val: boolean) => {
    setShowSideBar(val);
  };

  const { generateQuestions, generateSQL, runSQL } = props;

  return (
    <main className="flex min-h-screen text-lg">
      <Sidebar
        showSideBar={showSideBar}
        handleShowSideBar={handleShowSideBar}
        functions={props}
      />
      <Chatscreen
        showSideBar={showSideBar}
        handleShowSideBar={handleShowSideBar}
        generateQuestions={generateQuestions}
        generateSQL={generateSQL}
        runSQL={runSQL}
      />
    </main>
  );
};

export default Dashboard;
