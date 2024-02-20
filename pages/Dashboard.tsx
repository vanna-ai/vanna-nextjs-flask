"use client";
import React from "react";
import Sidebar from "@/components/Sidebar";
import Chatscreen from "@/components/Chatscreen";
import { AxiosResponse } from "axios";
import { RUNResponse, SQLResponse } from "@/helpers/types";
import ContextProvider from "@/context/ContextProvider";

type FunctionProps = {
  generateQuestions: () => Promise<AxiosResponse<any, any>>;
  generateSQL: (question: string) => Promise<SQLResponse>;
  runSQL: (sql: string) => Promise<RUNResponse>;
};

const Dashboard: React.FC<FunctionProps> = (props: FunctionProps) => {
  const { generateQuestions, generateSQL, runSQL } = props;

  return (
    <ContextProvider>
      <main className="flex min-h-screen text-lg">
        <Sidebar />
        <Chatscreen
          generateQuestions={generateQuestions}
          generateSQL={generateSQL}
          runSQL={runSQL}
        />
      </main>
    </ContextProvider>
  );
};

export default Dashboard;
