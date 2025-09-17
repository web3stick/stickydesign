import { useEffect, useState } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

import "./toggle_switch.css";
import toggleSwitchCSS from "./toggle_switch.css?raw";
import STICKY_toggle_switch from "./toggle_switch_component";
import toggleSwitchComponent from "./toggle_switch_component?raw";
import { toggleSwitchExample } from "./toggle_switch_code_example";

const STICKY_design_toggle_switch_page = () => {
  const [toggleMessage, setToggleMessage] = useState("");

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  const handleToggle = (isToggled: boolean) => {
    const message = isToggled ? "Toggled On" : "Toggled Off";
    setToggleMessage(message);
    console.log(message);
  };

  return (
    <section>
      <h1>STICKY_toggle_switch</h1>
      <p>Toggle switch for sticky</p>

      {/* STICKY_toggle_switch */}
      <STICKY_toggle_switch leftText="Off" rightText="On" onToggle={handleToggle} />
      
      {toggleMessage && <p>Message: {toggleMessage}</p>}

      <h2>How to Reuse</h2>
      <p>
        The STICKY_toggle_switch component can be easily reused throughout your application.
        <br />
        Simply import it and pass the desired props:
      </p>

      <pre>
        <code className="language-js">{toggleSwitchExample}</code>
      </pre>

      <h2>Component Code</h2>
      <pre>
        <code className="language-js">{toggleSwitchComponent}</code>
      </pre>

      <h2>CSS Code</h2>
      <pre>
        <code className="language-css">{toggleSwitchCSS}</code>
      </pre>
    </section>
  );
};

export default STICKY_design_toggle_switch_page;