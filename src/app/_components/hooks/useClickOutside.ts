import { useEffect } from "react";

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  callback: (e?: MouseEvent) => void,
  ignoreRefs: React.RefObject<HTMLElement>[] = [],
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !ignoreRefs.some((ignoreRef) => ignoreRef.current?.contains(event.target as Node))
      ) {
        callback(event);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback, ignoreRefs]);
}

export default useOutsideClick;