import type { FunctionalComponent } from "preact";
import { useState } from "preact/hooks";
import "./toggle_switch.css";

interface ToggleSwitchProps {
  leftText?: string;
  rightText?: string;
  onToggle?: (isToggled: boolean) => void;
  initialState?: boolean;
}

const STICKY_toggle_switch: FunctionalComponent<ToggleSwitchProps> = ({
  leftText = "Off",
  rightText = "On",
  onToggle,
  initialState = false
}) => {
  const [isToggled, setIsToggled] = useState(initialState);

  const handleToggle = () => {
    const newState = !isToggled;
    setIsToggled(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <div class="switch-container">
      <span class="switch-label">{leftText}</span>
      <label class="switch">
        <input
          type="checkbox"
          checked={isToggled}
          onChange={handleToggle}
        />
        <span class="slider"></span>
      </label>
      <span class="switch-label">{rightText}</span>
    </div>
  );
};

export default STICKY_toggle_switch;