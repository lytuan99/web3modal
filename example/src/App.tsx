import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dialog } from "./Dialog";
import Home from "./Home";

const App = () => {

  return (
    <div>
      <Dialog>
        {(dialog: any) => {
          return <Home dialog={dialog} />;
        }}
      </Dialog>
    </div>
  );
};

export default App;
