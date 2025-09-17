import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

// import css
import "./button.css";
import button_CSS from "./button.css?raw";
import STICKY_button from "./button_componenet";
import button_Component from "./button_componenet?raw";

// STICKY_design_button_page
const STICKY_design_button_page = () => {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <section>
      <h1>STICKY_button</h1>
      <p>button for sticky</p>
      
      {/*STICKY_button*/}
      <STICKY_button text="STICKY_button" />

      <h2>How to Reuse</h2>
      <p>
        The STICKY_button component can be easily reused throughout your application.
        <br/>
        Simply import it and pass the desired text as a prop:
      </p>
      
      <pre>
        <code className="language-js">{`import STICKY_button from "@src/design/basic/button/button_componenet";

// Usage
<STICKY_button text="Click Me" />`}</code>
      </pre>

      <h2>Component Code</h2>
      <pre>
        <code className="language-js">{button_Component}</code>
      </pre>

      <h2>CSS Code</h2>
      <pre>
        <code className="language-css">{button_CSS}</code>
      </pre>
    </section>
  );
};

export default STICKY_design_button_page;
