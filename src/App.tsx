// import pkg
import { Router, Route } from "preact-router";

// import css
import "./css/main.css";

// import ts
import "./ts/hello.ts";
import { ROUTES } from "./ts/routes.ts";


// design
import STICKY_design_nav from "./design/nav_header.tsx";
import STICKY_design_nav_section from "./design/nav_section.tsx";
import STICKY_design_header from "./design/header.tsx";
import STICKY_design_color from "./design/color/color.tsx";
import STICKY_design_button from "./design/button/button.tsx";
// import STICKY_design_near from "./design/near/near.tsx";
import STICKY_design_near_all_tkn_swap from "./design/near/near_all_tkn_swap.tsx";
import STICKY_design_near_auth_button from "./design/near/near_auth_button.tsx";
import STICKY_design_footer from "./design/footer.tsx";


// App
const App = () => {
  return (
    <main>
      <STICKY_design_nav/>
      <Router>
        <Route path={ROUTES.home.path} component={STICKY_design_header} />
        <Route path={ROUTES.nav.path} component={STICKY_design_nav_section} />
        <Route path={ROUTES.color.path} component={STICKY_design_color} />
        <Route path={ROUTES.button.path} component={STICKY_design_button} />
        <Route path={ROUTES.near_all_swap.path} component={STICKY_design_near_all_tkn_swap} />
        <Route path={ROUTES.near_auth_button.path} component={STICKY_design_near_auth_button} />
        <Route default component={STICKY_design_header} />
      </Router>
      <STICKY_design_footer/>
    </main>
  );
};

export default App;
