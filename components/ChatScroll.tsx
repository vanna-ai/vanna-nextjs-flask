import React, { useEffect, useRef } from "react";

function useChatScroll<T>(
  dep: T
): React.MutableRefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      // Using scrollTo with smooth behavior
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth", // Enables smooth scrolling
      });
    }
  }, [dep]);

  return ref;
}

export default useChatScroll;
