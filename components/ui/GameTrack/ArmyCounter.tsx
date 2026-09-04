import { useThemeColor } from "@/hooks/useThemeColor";
import { Card } from "@rneui/themed";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import CounterButtonArmy from "./ArmyButtonCount";
type ArmyCardProp = {
  modelCount: number;
  remainingModels: number;
  onRemainingModelsChange: (value: number) => void;
};

//Card to display army status to user
const ArmyCount = ({
  modelCount = 0,
  remainingModels,
  onRemainingModelsChange,
}: ArmyCardProp) => {
  const buttonText = useThemeColor({}, "buttonText");

  const cardColor = useThemeColor({}, "buttonEvil");
  const deadCount = modelCount - remainingModels;
  return (
    <>
      <ScrollView>
        <View style={styles.container}>
          <Card
            containerStyle={{
              backgroundColor: cardColor,
              borderRadius: 10,
              padding: 16,
              marginHorizontal: 0,
            }}
          >
            <Card.Title
              style={{
                color: buttonText,
                fontFamily: "briosoUberBold",
                fontSize: 25,
              }}
            >
              Army Count
            </Card.Title>

            <CounterButtonArmy
              label={
                String(modelCount - deadCount) +
                "/" +
                String(modelCount) +
                " (" +
                String(
                  deadCount < Math.floor(modelCount / 2) + 1
                    ? String(Math.floor(modelCount / 2) + 1 - deadCount) +
                        " away from breaking )"
                    : modelCount - deadCount <= Math.floor(modelCount / 4)
                    ? String("Quartered)")
                    : String(
                        Math.abs(
                          Math.floor(modelCount / 4) - (modelCount - deadCount)
                        )
                      ) + " till quartered)"
                )
              }
              initialValue={remainingModels}
              minValue={0}
              maxValue={modelCount}
              step={1}
              onValueChange={onRemainingModelsChange}
            />

            <Card.Divider />
          </Card>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 10,
  },
  fonts: {
    marginBottom: 8,
  },
  user: {
    flexDirection: "row",
    marginBottom: 6,
  },
  image: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    marginTop: 5,
  },
});

export default ArmyCount;
