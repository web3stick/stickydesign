import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

// import css
import "./color.css";
import color_CSS from "../../../css/color.css?raw";

const STICKY_design_color = () => {
  
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  
  const colors = [
    "--color-green",
    "--color-blue",
    "--color-red",
    "--color-yellow",
    "--color-purple",
    "--color-orange",
  ];

  return (
    <section>
      <h1>STICKY_color</h1>
      <p>color palette for sticky</p>
      
      {/*color_palette*/}
      <div className="color_palette">
        {colors.map((color) => (
          <div
            key={color}
            className="color_swatch"
            style={{ backgroundColor: `var(${color})` }}
          ></div>
        ))}
      </div>
      
      {/*pre*/}
      <pre class="color_pre">
        <code className="language-css">{color_CSS}</code>
      </pre>
    </section>
  );
};

export default STICKY_design_color;
