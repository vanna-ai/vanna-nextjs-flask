import React, { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

type CodeContainerProps = {
  children: string;
  language?: string;
};

const CodeContainer: React.FC<CodeContainerProps> = ({
  children,
  language = "",
}) => {
  const codeRef = useRef<HTMLElement>(null);

  const [show, setShow] = useState(false);

    useEffect(() => {
      if (codeRef.current) {
        hljs.highlightBlock(codeRef.current);
      }
    }, [children]);

  const copyToClipboard = async () => {
    if (codeRef.current) {
      try {
        await navigator.clipboard.writeText(codeRef.current.textContent ?? "");
        setShow(true);

        setTimeout(() => setShow(false), 2000);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    }
  };

  return (
    <div className="relative max-w-screen">
      <pre className="border-gray-800 border-4 bg-gray-800 rounded-tr-lg rounded-b-lg p-1 overflow-x-auto">
        <code
          ref={codeRef}
          className={`${language} block text-sm rounded text-white p-8 bg-gray-800`}
        >
          {children}
        </code>
      </pre>

      <button
        onClick={copyToClipboard}
        className="absolute top-1 right-1 text-xs p-2 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-gray-600"
      >
        Copy
      </button>
      {show && (
        <div className="absolute top-0 right-10 mt-2 px-3 py-1 bg-black text-white text-xs rounded">
          Copied!
        </div>
      )}
    </div>
  );
};

export default CodeContainer;
