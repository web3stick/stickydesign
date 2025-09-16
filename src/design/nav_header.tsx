// import
import { Menu } from "lucide-preact";
import { ROUTES } from "../ts/routes";

// STICKY_design_nav
const STICKY_design_nav = () => {
  return (
    <nav>
      <a href={ROUTES.home.path}><h4>stickydesign</h4></a>
      <a href={ROUTES.nav.path}>
        <Menu class="NAV_Menu_icon" />
    </a>
    </nav>
  );
};

export default STICKY_design_nav;
