import { useThemeColor } from "@/hooks/useThemeColor";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const FantasyChoiceButton = ({
  goodBackgroundImage = require("../../../assets/good.png"), // Update with your image path
  evilBackgroundImage = require("../../../assets/bad.png"),
  onGoodPress = () => console.log("Good choice selected"),
  onEvilPress = () => console.log("Evil choice selected"),
  tabBarHeight = 80, // Pass the tab bar height as a prop
}) => {
  const [hoveredSection, setHoveredSection] = useState(null);
  const [goodScale] = useState(new Animated.Value(1));
  const [evilScale] = useState(new Animated.Value(1));
  const primaryColor = useThemeColor({}, "buttonGood");
  const evilColor = useThemeColor({}, "buttonEvil");
  const textColor = useThemeColor({}, "buttonText");

  // Calculate available height (screen height minus tab bar)
  const availableHeight = screenHeight - tabBarHeight;

  const handleGoodPressIn = () => {
    setHoveredSection("good");
    Animated.spring(goodScale, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handleGoodPressOut = () => {
    setHoveredSection(null);
    Animated.spring(goodScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleEvilPressIn = () => {
    setHoveredSection("evil");
    Animated.spring(evilScale, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handleEvilPressOut = () => {
    setHoveredSection(null);
    Animated.spring(evilScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#1a1a1a",
      paddingBottom: 0, // Let the tab bar handle its own spacing
    },
    section: {
      flex: 1,
    },
    touchable: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    defaultOverlay: {
      backgroundColor:
        "rgba(" +
        String(
          evilColor
            .replace(
              /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
              (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
            )
            .substring(1)
            .match(/.{2}/g)
            .map((x) => parseInt(x, 16))
            .join(", ")
        ) +
        ", 0.1)",
    },
    goodOverlayActive: {
      backgroundColor:
        "rgba(" +
        String(
          primaryColor
            .replace(
              /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
              (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
            )
            .substring(1)
            .match(/.{2}/g)
            .map((x) => parseInt(x, 16))
            .join(", ")
        ) +
        ", 0.3)", // Blue overlay
    },
    evilOverlayActive: {
      backgroundColor:
        "rgba(" +
        String(
          evilColor
            .replace(
              /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
              (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
            )
            .substring(1)
            .match(/.{2}/g)
            .map((x) => parseInt(x, 16))
            .join(", ")
        ) +
        ", 0.3)", // Red overlay
    },
    text: {
      fontSize: availableHeight * 0.08, // 8% of available height (excluding tab bar)
      fontWeight: "bold",
      color: "white",
      textAlign: "center",
      textShadowColor: "rgba(0, 0, 0, 0.8)",
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
      fontFamily: "brioso",
    },
    textActive: {
      color: "#f0f9ff", // Lighter color when active
      textShadowRadius: 8,
    },
    subtitle: {
      fontSize: availableHeight * 0.025, // 2.5% of available height
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      fontFamily: "brioso",
      marginTop: availableHeight * 0.02, // 2% of available height for spacing
      textShadowColor: "rgba(0, 0, 0, 0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    divider: {
      height: 2,
      backgroundColor: "#4a5568",
    },
  });

  return (
    <View style={styles.container}>
      {/* Good Section - Top Half */}
      <Animated.View
        style={[styles.section, { transform: [{ scale: goodScale }] }]}
      >
        <Link
          href={{ pathname: "/armyList", params: { armyType: "good" } }}
          asChild
        >
          <TouchableOpacity
            style={styles.touchable}
            onPressIn={handleGoodPressIn}
            onPressOut={handleGoodPressOut}
            onPress={onGoodPress}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={goodBackgroundImage}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <View
                style={[
                  styles.overlay,
                  hoveredSection === "good"
                    ? styles.goodOverlayActive
                    : styles.defaultOverlay,
                ]}
              >
                <Text
                  style={[
                    styles.text,
                    hoveredSection === "good" && styles.textActive,
                  ]}
                >
                  GOOD
                </Text>
                {hoveredSection === "good" && (
                  <Text style={styles.subtitle}>Choose the path of light</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </Link>
      </Animated.View>

      <View style={styles.divider} />

      {/* Evil Section - Bottom Half */}
      <Animated.View
        style={[styles.section, { transform: [{ scale: evilScale }] }]}
      >
        {" "}
        <Link
          href={{ pathname: "/armyList", params: { armyType: "evil" } }}
          asChild
        >
          <TouchableOpacity
            style={styles.touchable}
            onPressIn={handleEvilPressIn}
            onPressOut={handleEvilPressOut}
            onPress={onEvilPress}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={evilBackgroundImage}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <View
                style={[
                  styles.overlay,
                  hoveredSection === "evil"
                    ? styles.evilOverlayActive
                    : styles.defaultOverlay,
                ]}
              >
                <Text
                  style={[
                    styles.text,
                    hoveredSection === "evil" && styles.textActive,
                  ]}
                >
                  EVIL
                </Text>
                {hoveredSection === "evil" && (
                  <Text style={styles.subtitle}>Embrace the darkness</Text>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </Link>
      </Animated.View>
    </View>
  );
};

export default FantasyChoiceButton;
