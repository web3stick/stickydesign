import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

// import css
import "./near.css";
import button_CSS from "./near.css?raw";

// STICKY_design_near
const STICKY_design_near = () => {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <section>
      <h1>STICKY_near</h1>
      <p>near components and logic for sticky</p>
      
      {/*STICKY_button*/}
      <button>STICKY_button</button>

      {/*pre*/}
      <pre>
        <code className="language-css">{button_CSS}</code>
      </pre>
    </section>
  );
};

export default STICKY_design_near;
