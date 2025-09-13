// import
import { ROUTES } from "../ts/routes";

// STICKY_design_footer
const STICKY_design_footer = () => {
  return (
    <footer>
      <nav>
        {Object.values(ROUTES).map((route) => (
          <a key={route.path} href={route.path}>
            {route.label}
          </a>
        ))}
      </nav>
      <p>copyright 2025 by sleet.near</p>
    </footer>
  );
};

export default STICKY_design_footer;
