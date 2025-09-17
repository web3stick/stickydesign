import { ROUTES } from "../ts/routes";

import NEAR_AUTH_BUTTON from "./near/auth_button/near_auth_button";
import { ArrowDownUp, LogIn } from "lucide-preact";

// STICKY_design_nav_section
const STICKY_design_nav_section = () => {
  return (
    <section class="nav_section">
      <h4>STICKY_design_nav_section</h4>
      <p>
        basic
        <br />
        <a href={ROUTES.color.path}>{ROUTES.color.label}</a>
        <br />
        <a href={ROUTES.button.path}>{ROUTES.button.label}</a>
        <br />
        near
      </p>
      <a href={ROUTES.near_auth_button.path} class="card-link">
        <div class="card">
          <div class="preview-container">
            <NEAR_AUTH_BUTTON />
          </div>
          <div class="label-container">{ROUTES.near_auth_button.label}</div>
        </div>
      </a>
      <a href={ROUTES.near_all_swap.path} class="card-link">
        <div class="card">
          <div class="preview-container">
            <ArrowDownUp />
          </div>
          <div class="label-container">{ROUTES.near_all_swap.label}</div>
        </div>
      </a>
    </section>
  );
};

export default STICKY_design_nav_section;
