import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type CounterButtonArmyProps = {
  initialValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  label?: string;
};

//Counter button
const CounterButtonArmy = ({
  initialValue = 0,
  minValue = 0,
  maxValue = 100,
  step = 1,
  onValueChange,
  disabled = false,
  label = "Counter",
}: CounterButtonArmyProps) => {
  const [count, setCount] = useState(initialValue);

  const decrement = () => {
    if (!disabled && count > minValue) {
      const newValue = count - step;
      setCount(newValue);
      onValueChange && onValueChange(newValue);
    }
  };

  const isDecrementDisabled = disabled || count <= minValue;
  const buttonColor = useThemeColor({}, "button");
  const buttonText = useThemeColor({}, "buttonText");
  const buttonGood = useThemeColor({}, "tint");
  const buttonEvil = useThemeColor({}, "buttonEvil");

  const styles = StyleSheet.create({
    buttonContainer: {
      backgroundColor: buttonColor,
      borderRadius: 7,
      padding: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      minWidth: 100,
      maxWidth: width * 0.8,
      borderWidth: 2,
      borderColor: "#E3E8EF",
    },
    disabledContainer: {
      backgroundColor: "#F5F5F5",
      borderColor: "#E0E0E0",
    },
    mainButton: {
      alignItems: "center",
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#E9ECEF",
    },
    labelText: {
      fontSize: 16,
      fontWeight: "600",
      color: buttonText,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      fontFamily: "brioso",
    },
    countText: {
      fontSize: 28,
      fontWeight: "bold",
      color: buttonText,
      fontFamily: "brioso",
    },
    disabledText: {
      color: "#A0A0A0",
    },
    subButtonsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    subButton: {
      flex: 1,
      minHeight: 44,
      minWidth: 44,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    minusButton: {
      backgroundColor: buttonEvil,
    },
    plusButton: {
      backgroundColor: buttonGood,
    },
    disabledSubButton: {
      backgroundColor: buttonGood,
      shadowOpacity: 0,
      elevation: 0,
    },
    subButtonText: {
      fontSize: 26,
      lineHeight: 30,
      fontWeight: "bold",
      color: "#fff",
    },
    disabledSubButtonText: {
      color: "#7F8C8D",
    },
  });

  return (
    <View
      style={[styles.buttonContainer, disabled && styles.disabledContainer]}
    >
      {/* Main button area */}
      <View style={styles.mainButton}>
        <Text style={[styles.labelText, disabled && styles.disabledText]}>
          {label}
        </Text>
        <Text style={[styles.countText, disabled && styles.disabledText]}>
          {count} models left
        </Text>
      </View>

      {/* Sub-buttons container */}
      <View style={styles.subButtonsContainer}>
        {/* Minus sub-button */}
        <TouchableOpacity
          style={[
            styles.subButton,
            styles.minusButton,
            isDecrementDisabled && styles.disabledSubButton,
          ]}
          onPress={decrement}
          disabled={isDecrementDisabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.subButtonText,
              isDecrementDisabled && styles.disabledSubButtonText,
            ]}
          >
            −
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[
            styles.subButton,
            styles.plusButton,
            isIncrementDisabled && styles.disabledSubButton,
          ]}
          onPress={increment}
          disabled={isIncrementDisabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.subButtonText,
              isIncrementDisabled && styles.disabledSubButtonText,
            ]}
          >
            +
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

export default CounterButtonArmy;
