import React, {
  useContext,
  createContext,
  ReactNode,
  useState,
  useMemo,
} from "react";
import { TMessage } from "@/helpers/types";

type RootContextType = {
  messageHistory: Array<TMessage>;
  handleChangeMessageHistory: (
    newMessage?: TMessage,
    newMessageHistory?: Array<TMessage>
  ) => void;
  showSideBar: boolean;
  handleShowSideBar: (val: any) => void;
  error: string;
  handleErrorChange: (val: string) => void;
};

const RootContext = createContext<RootContextType>({
  messageHistory: [],
  handleChangeMessageHistory: () => {},
  showSideBar: true,
  handleShowSideBar: () => {},
  error: "",
  handleErrorChange: () => {},
});

export function useRoot() {
  return useContext(RootContext);
}

type ContextProviderProps = {
  children: ReactNode;
};

const initState: Array<TMessage> = [
  { ai: "", user: "", messageId: "", type: "" },
];
const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [messageHistory, setMessageHistory] =
    useState<Array<TMessage>>(initState);
  const [showSideBar, setShowSideBar] = useState(true);
  const [error, setError] = useState("");

  const handleShowSideBar = (val: boolean) => {
    setShowSideBar(val);
  };

  const handleErrorChange = (err: string) => {
    setError(err);
  };

  const handleChangeMessageHistory = (
    newMessage?: TMessage,
    newMessageHistory?: Array<TMessage>
  ) => {
    if (newMessageHistory) {
      console.log("History Found");
      setMessageHistory(newMessageHistory);
    } else if (newMessage) {
      console.log("Message Found");
      setMessageHistory((prev: Array<TMessage>) => [...prev, newMessage]);
    }
  };

  const contextValue = useMemo(
    () => ({
      messageHistory,
      handleChangeMessageHistory,
      showSideBar,
      handleShowSideBar,
      error,
      handleErrorChange,
    }),
    [messageHistory, showSideBar, error]
  );

  return (
    <RootContext.Provider value={contextValue}>
      <div>{children}</div>
    </RootContext.Provider>
  );
};

export default ContextProvider;
