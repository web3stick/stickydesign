import { useEffect, useState } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

// import "./toggle_switch.css";
import toggleSwitchCSS from "./toggle_switch.css?raw";
import STICKY_toggle_switch from "./toggle_switch_component";
import toggleSwitchComponent from "./toggle_switch_component?raw";
import { toggleSwitchExample } from "./toggle_switch_code_example";

const STICKY_design_toggle_switch_page = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <section>
      <h1>STICKY_toggle_switch</h1>
      <p>Toggle switch component for sticky design system</p>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div>
            <h3>Default Toggle</h3>
            <STICKY_toggle_switch onToggle={(isToggled) => {
              const msg = isToggled ? "Toggled On" : "Toggled Off";
              setMessage(msg);
              console.log(msg);
            }} />
          </div>

          <div>
            <h3>Initially On</h3>
            <STICKY_toggle_switch initialState={true} onToggle={(isToggled) => {
              const msg = isToggled ? "Initially On" : "Switched Off";
              setMessage(msg);
              console.log(msg);
            }} />
          </div>

          <div>
            <h3>Custom Labels</h3>
            <STICKY_toggle_switch 
              leftText="web3" 
              rightText="web4" 
              onToggle={(isToggled) => {
                const msg = isToggled ? "web4 activated" : "web3 activated";
                setMessage(msg);
                console.log(msg);
              }} 
            />
          </div>

          <div>
            <h3>No Labels</h3>
            <STICKY_toggle_switch 
              onToggle={(isToggled) => {
                const msg = isToggled ? "Switched On" : "Switched Off";
                setMessage(msg);
                console.log(msg);
              }} 
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        {message && <p>Message: {message}</p>}
      </div>

      <h2>How to Reuse</h2>
      <p>
        The STICKY_toggle_switch component can be easily reused throughout your application.
        <br/>
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