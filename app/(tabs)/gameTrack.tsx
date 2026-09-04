import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import SavedList from "@/components/ui/Library/SavedList";
import type { PersistedArmy } from "@/storage/ArmyRepository";
import { localArmyRepository } from "@/storage/LocalArmyRepository";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, LogBox, StyleSheet } from "react-native";

LogBox.ignoreAllLogs(true); // Hides all warnings

export default function GameTracker() {
  const router = useRouter();
  const [savedArmies, setSavedArmies] = useState<PersistedArmy[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const loadSavedArmies = async () => {
        setLoading(true);
        try {
          const armies = await localArmyRepository.listSavedArmies();
          if (armies.length > 0) {
            setSavedArmies(armies);

            // If there is an active match, reopen it
            try {
              const activeUri =
                FileSystem.documentDirectory + "active-game.json";
              const activeInfo = await FileSystem.getInfoAsync(activeUri);
              if (activeInfo.exists) {
                const activeContent =
                  await FileSystem.readAsStringAsync(activeUri);
                const activeMatch = JSON.parse(activeContent);
                const idx = parseInt(activeMatch?.savedArmyIdx, 10);

                if (!isNaN(idx) && armies[idx]) {
                  router.replace({
                    pathname: "/heroTrack",
                    params: {
                      savedArmyIdx: idx.toString(),
                      armyName: armies[idx].faction,
                    },
                  });
                  return;
                }

                // Clean up invalid active match
                await FileSystem.deleteAsync(activeUri, { idempotent: true });
              }
            } catch (e) {
              // If active match fails to load, allow list to render
            }
          } else {
            setSavedArmies([]);
          }
        } catch (e) {
          setSavedArmies([]);
        } finally {
          setLoading(false);
        }
      };
      loadSavedArmies();
    }, []),
  );

  const handleStartMatch = async (idx: number) => {
    try {
      const activeUri = FileSystem.documentDirectory + "active-game.json";
      await FileSystem.writeAsStringAsync(
        activeUri,
        JSON.stringify({ savedArmyIdx: idx, resetToMax: true }, null, 2),
      );
    } catch (e) {
      // If we fail to persist, still allow navigation
    }

    router.push({
      pathname: "/heroTrack",
      params: {
        savedArmyIdx: idx.toString(),
        armyName: savedArmies[idx]?.faction,
      },
    });
  };

  const handleDelete = async (idxToDelete: number) => {
    Alert.alert("Delete Army", "Are you sure you want to delete this army?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const newArmies = savedArmies.filter(
              (_, index) => index !== idxToDelete,
            );
            await localArmyRepository.deleteSavedArmy(idxToDelete);
            setSavedArmies(newArmies);
          } catch (e) {
            alert("Failed to delete army.");
          }
        },
      },
    ]);
  };

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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Game Track</ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">
          Choose army below and start a new game
        </ThemedText>
      </ThemedView>
      {loading ? (
        <ThemedText>Loading...</ThemedText>
      ) : savedArmies.length === 0 ? (
        <ThemedText
          style={{
            textAlign: "center",
            fontFamily: "brioso",
            fontSize: 21,
          }}
        >
          No saved armies found. Go to Army Workshop to create your first army!
        </ThemedText>
      ) : (
        savedArmies.map((army, idx) => (
          <SavedList
            key={`${army.name}-${idx}`}
            name={army.name}
            points={army.points ?? 0}
            faction={army.faction}
            modelCount={army.modelCount ?? 0}
            onDelete={() => handleDelete(idx)}
            edit={false}
            onEdit={() => handleStartMatch(idx)}
          />
        ))
      )}
    </ParallaxScrollView>
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
    gap: 5,
  },
});
