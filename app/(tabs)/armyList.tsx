import { StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ListItem } from "@rneui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import TouchableScale from "react-native-touchable-scale";
import React from "react";

import { useThemeColor } from "@/hooks/useThemeColor";

import angmarAndNorthernEvil from "../data/evil/angmar_and_northern_evil.json";
import dolGuldurAndMirkwoodEvil from "../data/evil/dol_guldur_and_mirkwood_evil.json";
import gundabadMoriaGoblinsAndOrcs from "../data/evil/gundabad,_moria,_goblins,_and_orcs.json";
import haradUmbarKhandEast from "../data/evil/harad,_umbar,_khand,_east.json";
import isengardAndAllies from "../data/evil/isengard_and_allies.json";
import mordorAndSauronAligned from "../data/evil/mordor_and_sauron-aligned.json";
import shireInvaders from "../data/evil/shire_invaders.json";
import dwarves from "../data/good/dwarves.json";
import elves from "../data/good/elves.json";
import hobbitArmy from "../data/good/hobbits_and_the_shire.json";
import men from "../data/good/men_of_the_west.json";
import otherGoodArmy from "../data/good/other_good.json";
import rohan from "../data/good/rohan.json";

export default function ArmyLists() {
  const { armyType: armyTypeParam } = useLocalSearchParams<{
    armyType?: string | string[];
  }>();
  const armyType = Array.isArray(armyTypeParam)
    ? armyTypeParam[0]
    : armyTypeParam;
  const router = useRouter();

  // Get themed colors
  const goodColor = useThemeColor({}, "buttonEvil");
  const buttontextColor = useThemeColor({}, "buttonText");
  const touchableScaleProps = {
    Component: TouchableScale as unknown as typeof React.Component,
    friction: 90,
    tension: 100,
    activeScale: 0.95,
  };
  type ArmySummary = { name: string };
  type ArmyGroup = [ArmySummary[], string];
  const evilArmy: ArmyGroup[] = [
    [mordorAndSauronAligned, "Mordor & Sauron-Aligned"],
    [dolGuldurAndMirkwoodEvil, "Dol Guldur & Mirkwood Evil"],
    [isengardAndAllies, "Isengard & Allies"],
    [angmarAndNorthernEvil, "Angmar & Northern Evil"],
    [haradUmbarKhandEast, "Harad, Umbar, Khand, East"],
    [gundabadMoriaGoblinsAndOrcs, "Gundabad, Moria, Goblins, and Orcs"],
    [shireInvaders, "Shire Invaders"],
  ];

  const goodArmy: ArmyGroup[] = [
    [dwarves, "Dwarves"],
    [elves, "Elves"],
    [men, "Men of the West"],
    [rohan, "Rohan"],
    [hobbitArmy, "Hobbits"],
    [otherGoodArmy, "Other"],
  ];
  const armiesToRender = armyType === "good" ? goodArmy : evilArmy;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            {armyType === "good" ? "Armies of Good" : "Armies of Evil"}
          </ThemedText>
        </ThemedView>
        {armiesToRender.map((index, idx) => (
          <View key={idx}>
            <ThemedText key={idx} type="title">
              {String(index[1])}
            </ThemedText>

            {index[0].map((army, idx) => (
              <View key={idx} style={styles.stepContainer}>
                <ListItem
                  key={`${army.name}-${idx}`}
                  {...touchableScaleProps}
                  onPress={() =>
                    router.push({
                      pathname: "/armyBuilder",
                      params: { armyName: army.name, armyType },
                    })
                  }
                  containerStyle={{
                    backgroundColor: goodColor,
                  }} // <-- Themed background
                >
                  <ListItem.Content>
                    <ListItem.Title
                      style={{
                        color: buttontextColor,
                        fontFamily: "brioso",
                        fontSize: 20,
                      }}
                    >
                      {army.name}
                    </ListItem.Title>
                  </ListItem.Content>
                </ListItem>{" "}
              </View>
            ))}
          </View>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 150,
    width: 400,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
