import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

// import css
import "./button.css";
import button_CSS from "./button.css?raw";

// STICKY_design_button
const STICKY_design_button = () => {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <section>
      <button>STICKY_button</button>

      <pre>
        <code className="language-css">{button_CSS}</code>
      </pre>
    </section>
  );
};

export default STICKY_design_button;
