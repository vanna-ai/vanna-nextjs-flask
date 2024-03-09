import React from "react";
import Button from "./Button";
import { MESSAGE_TYPES, MODES } from "@/helpers/enums";
import { TMessage } from "@/helpers/types";

type Props = {
  currentIndex: number;
  mode: string;
  messageHistory: Array<any>;
  value: TMessage;
  handleRunClick: (value: TMessage, ix: number) => any;
  handleEditClick: (ix: number) => any;
  handleSaveClick: (ix: number) => any;
};

const ChatButtons = (props: Props) => {
  const {
    currentIndex,
    mode,
    messageHistory,
    value,
    handleRunClick,
    handleEditClick,
    handleSaveClick,
  } = props;
  const shouldShowButtons =
    currentIndex === messageHistory?.length - 1 &&
    value?.type === MESSAGE_TYPES.sql;

  // Function to render the buttons based on the mode
  const renderButtons = () => {
    console.log({ mode });
    if (mode === MODES.run) {
      return (
        <>
          <Button
            text={MODES.run}
            className=""
            handleClick={() => handleRunClick(value, currentIndex)}
          />
          <Button
            text={MODES.edit}
            className=""
            handleClick={() => handleEditClick(currentIndex)}
          />
        </>
      );
    } else {
      return (
        <Button
          text="Save"
          className=""
          handleClick={() => handleSaveClick(currentIndex)}
        />
      );
    }
  };

  return (
    <div>
      {shouldShowButtons && (
        <div className="flex flex-row items-center justify-center gap-4 ml-24">
          {renderButtons()}
        </div>
      )}
    </div>
  );
};

export default ChatButtons;
