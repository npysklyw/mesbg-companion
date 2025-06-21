/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#295E37";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#295E37",
    background: "#e8deba",
    tint: tintColorLight,
    icon: "#687076",
    button: "#c8d9ad",
    buttonText: "#fff",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#e5e4f2",
    background: "#040214",
    tint: tintColorDark,
    button: "#bbb7eb",
    buttonText: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};
