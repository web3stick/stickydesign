import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";

// near tsx
import NEAR_AUTH_BUTTON from "./auth_button/near_auth_button";
import NEAR_AUTH_BUTTON_RAW_TSX from "./auth_button/near_auth_button.tsx?raw";
import NEAR_AUTH_BUTTON_RAW_TS from "./auth_button/near.auth.ts?raw";



// STICKY_design_near_auth_button
const STICKY_design_near_auth_button = () => {
  
  // Prism
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  
  return (
    <section>
      <h1>NEAR AUTH BUTTON</h1>
      <NEAR_AUTH_BUTTON />
      
      
      {/*pre*/}
      <p>BUTTON TSX</p>
      <pre>
        <code className="language-js">{NEAR_AUTH_BUTTON_RAW_TSX}</code>
      </pre>
      <p>BUTTON TS</p>
      <pre>
        <code className="language-js">{NEAR_AUTH_BUTTON_RAW_TS}</code>
      </pre>

    </section>
  );
};

export default STICKY_design_near_auth_button;
