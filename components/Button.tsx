import React from "react";

type Props = {
  text: string;
  className: string;
  handleClick: (value: any) => any;
};

const Button = (props: Props) => {
  const { text, className, handleClick } = props;
  return (
    <button
      className={`flex items-center justify-center border p-2 w-16 h-10 rounded hover:bg-black hover:border-black hover:text-white ${className}`}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default Button;
