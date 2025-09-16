import { ROUTES } from "../ts/routes";

// STICKY_design_nav_section
const STICKY_design_nav_section = () => {
  return (
    <section class="nav_section">
      <h4>STICKY_design_nav_section</h4>
      <p>
        basic
        <br/>
        <a href={ROUTES.color.path}>{ROUTES.color.label}</a>
      </p>
    </section>
  );
};

export default STICKY_design_nav_section;