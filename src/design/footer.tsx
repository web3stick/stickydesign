// import
import { ROUTES } from "../ts/routes";

// handleLinkClick
const handleLinkClick = () => {
  window.scrollTo(0, 0);
};

// STICKY_design_footer
const STICKY_design_footer = () => {

  return (
    <footer>
      <nav>
        {Object.values(ROUTES).map((route) => (
          <a key={route.path} href={route.path} onClick={handleLinkClick}>
            {route.label}
          </a>
        ))}
      </nav>
      <p>copyright 2025 by web3stick.near</p>
    </footer>
  );
};

export default STICKY_design_footer;
