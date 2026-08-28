import { useTheme } from "@/components/ThemeContext";
import { StyleSheet } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function DropdownTheme() {
  const { palette, setPalette, mode, toggleMode, palettes, themeColors } =
    useTheme();

  return (
    <Dropdown
      data={palettes.map((p) => ({
        label: p.charAt(0).toUpperCase() + p.slice(1),
        value: p,
      }))}
      style={{
        backgroundColor: themeColors.button,
        borderColor: themeColors.buttonGood,
        padding: 8,
      }}
      placeholderStyle={{ color: themeColors.buttonText }}
      selectedTextStyle={{
        color: themeColors.buttonText,
        fontSize: 20,
        fontFamily: "brioso",
      }}
      itemTextStyle={{
        color: themeColors.buttonText,
        fontSize: 20,
        fontFamily: "brioso",
      }}
      itemContainerStyle={{
        backgroundColor: themeColors.button,
        borderColor: themeColors.buttonGood,
      }}
      iconStyle={{ tintColor: themeColors.buttonText }}
      maxHeight={300}
      labelField="label"
      valueField="value"
      placeholder="Select Palette"
      searchPlaceholder="Search..."
      activeColor={themeColors.button}
      value={palette}
      onChange={(item) => {
        setPalette(item.value);
      }}
    />
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
