import { useEffect } from "preact/hooks";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";
import './near.config'
import './near.auth'

// near tsx
import NEAR_AUTH_BUTTON from "./near_auth_button";
import { Swap } from './SWAP_main';

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
      <NEAR_AUTH_BUTTON />
      <h1>TOKEN SWAP COMPONENTS</h1>
      <Swap />

    </section>
  );
};

export default STICKY_design_near;
