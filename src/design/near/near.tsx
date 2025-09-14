import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";



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

    </section>
  );
};

export default STICKY_design_near;
