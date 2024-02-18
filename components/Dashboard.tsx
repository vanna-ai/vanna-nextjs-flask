"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Chatscreen from "./Chatscreen";
import { AxiosResponse } from "axios";

type FunctionProps = {
  generateQuestions: () => Promise<AxiosResponse<any, any>>;
};

const Dashboard: React.FC<FunctionProps> = (props: FunctionProps) => {
  const [showSideBar, setShowSideBar] = useState(true);
  const handleShowSideBar = (val: boolean) => {
    setShowSideBar(val);
  };

  const { generateQuestions } = props;

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
      />
    </main>
  );
};

export default Dashboard;
