import { useThemeColor } from "@/hooks/useThemeColor";
import { Card } from "@rneui/themed";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import StatsGrid from "./Grid";

type HeroCardProp = {
  name: string;
  values?: [number, number, number, number];
  maxValues?: [number, number, number, number];
  onValuesChange?: (values: [number, number, number, number]) => void;
};

//Hero Card to Render per hero
const Cards = ({
  name = "Hero",
  values = [4, 5, 4, 5],
  maxValues,
  onValuesChange,
}: HeroCardProp) => {
  const buttonText = useThemeColor({}, "buttonText");
  const cardColor = useThemeColor({}, "buttonEvil");
  return (
    <>
      <ScrollView>
        <View style={styles.container}>
          <Card
            containerStyle={{ backgroundColor: cardColor, borderRadius: 5 }}
          >
            <Card.Title
              style={{
                color: buttonText,
                fontFamily: "briosoUberBold",
                fontSize: 25,
              }}
            >
              {name}
            </Card.Title>
            {/* <Card.Divider /> */}

            <StatsGrid
              values={values}
              maxValues={maxValues}
              onValuesChange={onValuesChange}
            ></StatsGrid>
          </Card>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 0,
  },
  fonts: {
    marginBottom: 0,
  },
  user: {
    flexDirection: "row",
    marginBottom: 3,
  },
  image: {
    width: 0,
    height: 0,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    marginTop: 0,
  },
});

export default Cards;
