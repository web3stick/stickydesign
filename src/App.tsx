// import pkg
import { Router, Route } from "preact-router";

// import css
import "./css/App.css";

// import ts
import "./ts/hello.ts";
import { ROUTES } from "./ts/routes.ts";


// design
import STICKY_design_header from "./design/header.tsx";
import STICKY_design_color from "./design/color/color.tsx";
import STICKY_design_footer from "./design/footer.tsx";


// App
const App = () => {
  return (
    <main>
      <Router>
        <Route path={ROUTES.home.path} component={STICKY_design_header} />
        <Route path={ROUTES.color.path} component={STICKY_design_color} />
      </Router>
      <STICKY_design_footer/>
    </main>
  );
};

export default App;
