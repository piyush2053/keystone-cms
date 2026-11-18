import { useEffect, useState } from "react";

// Routes: #/broker/<page>/<sub>, #/developer/<page>/<sub>, #/admin/<page>; anything else is the portal page.
export function useRoute() {
  const read = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const f = () => setParts(read());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return parts;
}
export const goTo = (path) => {
  location.hash = "#/" + path;
};
