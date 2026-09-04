import { useThemeColor } from "@/hooks/useThemeColor";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import CounterButton from "./ButtonCount";
const stats = ["Wounds", "Might", "Will", "Fate"];

type HeroProps = {
  values?: [number, number, number, number];
  maxValues?: [number, number, number, number];
  onValuesChange?: (values: [number, number, number, number]) => void;
};

// Maps Array of hero stats to a grid
export default function StatsGrid({
  values = [1, 1, 1, 1],
  maxValues,
  onValuesChange,
}: HeroProps) {
  const buttonColor = useThemeColor({}, "button");
  const buttonText = useThemeColor({}, "buttonText");
  const [currentValues, setCurrentValues] =
    useState<[number, number, number, number]>(values);
  useEffect(() => {
    // Keep editable grid state synchronized with externally restored values.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentValues(values);
  }, [values]);
  const resolvedMaxValues: [number, number, number, number] =
    maxValues ?? values;

  const handleQuantityChange = (index: number) => (newValue: number) => {
    const updatedValues = [...currentValues] as [
      number,
      number,
      number,
      number,
    ];
    updatedValues[index] = newValue;
    setCurrentValues(updatedValues);
    if (onValuesChange) {
      onValuesChange(updatedValues);
    }
  };

  const styles = StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
    },
    cell: {
      width: 30,
      height: 30,
      backgroundColor: buttonColor,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    text: {
      color: buttonText,
      fontSize: 12,
      fontFamily: "brioso",
    },
  });
  return (
    <View>
      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <CounterButton
            label={stat}
            key={index}
            initialValue={currentValues[index]}
            minValue={0}
            maxValue={resolvedMaxValues[index] ?? 0}
            step={1}
            onValueChange={handleQuantityChange(index)}
          />
        ))}
      </View>
    </View>
  );
}
