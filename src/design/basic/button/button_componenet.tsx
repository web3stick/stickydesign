import { FunctionalComponent } from "preact";
import "./button.css";

interface ButtonProps {
  text: string;
}

const STICKY_button: FunctionalComponent<ButtonProps> = ({ text }) => {
  return <button>{text}</button>;
};

export default STICKY_button;