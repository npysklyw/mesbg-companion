import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import SavedList from "@/components/ui/SavedList";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, LogBox, StyleSheet } from "react-native";

LogBox.ignoreAllLogs(true); // Hides all warnings

type SavedArmy = {
  name: string;
  points: number;
  faction: string;
  modelCount: number;
};

export default function TabTwoScreen() {
  const router = useRouter();
  const [savedArmies, setSavedArmies] = useState<SavedArmy[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const loadSavedArmies = async () => {
        setLoading(true);
        try {
          const fileUri = FileSystem.documentDirectory + "saved-army.json";
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists) {
            const content = await FileSystem.readAsStringAsync(fileUri);
            const parsed = JSON.parse(content);
            setSavedArmies(Array.isArray(parsed) ? parsed : [parsed]);
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
    }, [])
  );

  const handleDelete = async (idxToDelete: number) => {
    Alert.alert("Delete Army", "Are you sure you want to delete this army?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const fileUri = FileSystem.documentDirectory + "saved-army.json";
            let newArmies = [...savedArmies];
            newArmies.splice(idxToDelete, 1);
            if (newArmies.length === 0) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            } else {
              await FileSystem.writeAsStringAsync(
                fileUri,
                JSON.stringify(newArmies, null, 2)
              );
            }
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
        <ThemedText type="title">Library</ThemedText>
      </ThemedView>
      {loading ? (
        <ThemedText>Loading...</ThemedText>
      ) : savedArmies.length === 0 ? (
        <ThemedText>
          No saved armies found. Go to Army Workshop to create your first army!
        </ThemedText>
      ) : (
        savedArmies.map((army, idx) => (
          <SavedList
            key={`${army.name}-${idx}`}
            name={army.name}
            points={army.points}
            faction={army.faction}
            modelCount={army.modelCount}
            onDelete={() => handleDelete(idx)}
            onEdit={() =>
              router.push({
                pathname: "/armyBuilder",
                params: {
                  savedArmyIdx: idx.toString(), // Pass as string for URL params
                },
              })
            }
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
    gap: 8,
  },
});
