import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

// import css
import "./button.css";
import button_CSS from "./button.css?raw";

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
      <button>STICKY_button</button>

      {/*pre*/}
      <pre>
        <code className="language-css">{button_CSS}</code>
      </pre>
    </section>
  );
};

export default STICKY_design_button_page;
