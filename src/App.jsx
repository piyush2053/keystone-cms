import { useEffect } from "react";
import { useRoute } from "./nav";
import BrokerApp from "./broker/BrokerApp";
import DeveloperApp from "./developer/DeveloperApp";
import OwnerApp from "./owner/OwnerApp";

// #/broker (default, also the landing page), #/developer, #/admin (Keystone owner, not linked).
export default function App() {
  const [area, page, sub] = useRoute();
  const kind = area === "developer" || area === "admin" ? area : "broker";
  useEffect(() => {
    if (area !== kind) location.replace("#/broker");
  }, [area, kind]);
  useEffect(() => {
    document.body.className = "r-" + kind;
    document.title = kind === "developer" ? "Keystone for Developers" : kind === "admin" ? "Keystone owner console" : "Keystone for Brokers";
  }, [kind]);
  return (
    <div className="webroot">
      {kind === "developer" ? <DeveloperApp page={page || "home"} sub={sub} /> : kind === "admin" ? <OwnerApp page={page || "overview"} /> : <BrokerApp page={area === "broker" ? page || "home" : "home"} sub={sub} />}
    </div>
  );
}
