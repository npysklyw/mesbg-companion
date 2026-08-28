import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@rneui/themed";
type ButtonProp = {
  name: string;
  onPress?: () => void;
};

//Hero Card to Render per hero
const SettingsButton = ({
  name = "Hero",
  onPress = () => console.log("Button"),
}: ButtonProp) => {
  const buttonText = useThemeColor({}, "buttonText");
  const buttonColor = useThemeColor({}, "button");
  return (
    <Button
      buttonStyle={{ backgroundColor: buttonColor }}
      titleStyle={{ color: buttonText, fontFamily: "brioso" }}
      style={{ marginBottom: 12 }}
      onPress={onPress}
    >
      {name}
    </Button>
  );
};

export default SettingsButton;
