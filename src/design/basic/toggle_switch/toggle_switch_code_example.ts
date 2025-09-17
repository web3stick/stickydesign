export const toggleSwitchExample = `import STICKY_toggle_switch from "@src/design/basic/toggle_switch/toggle_switch_component";

// Usage with default texts
<STICKY_toggle_switch />

// Usage with custom texts
<STICKY_toggle_switch leftText="No" rightText="Yes" />

// Usage without any texts
<STICKY_toggle_switch leftText="" rightText="" />
// or simply
<STICKY_toggle_switch />

// Usage with toggle handler
<STICKY_toggle_switch onToggle={(isToggled) => console.log(isToggled ? "Toggled On" : "Toggled Off")} />`;