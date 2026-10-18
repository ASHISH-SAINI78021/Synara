// src/hooks/useStored.js  (state that is also saved in the browser)
import { useEffect, useState } from "react";

export default function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked: still works for this session */
    }
  }, [key, value]);
  return [value, setValue];
}
