import { useThemeColor } from "@/hooks/useThemeColor";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type FantasyChoiceButtonProps = {
  goodBackgroundImage?: ImageSourcePropType;
  evilBackgroundImage?: ImageSourcePropType;
  onGoodPress?: () => void;
  onEvilPress?: () => void;
  tabBarHeight?: number;
};

const hexToRgb = (color: string) => {
  const expanded = color.replace(
    /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
    (_match: string, red: string, green: string, blue: string) =>
      `#${red}${red}${green}${green}${blue}${blue}`,
  );
  return expanded.substring(1).match(/.{2}/g)?.map((value) => parseInt(value, 16)).join(", ") ?? "0, 0, 0";
};

const FantasyChoiceButton = ({
  goodBackgroundImage = require("../../../assets/good.png"), // Update with your image path
  evilBackgroundImage = require("../../../assets/bad.png"),
  onGoodPress = () => console.log("Good choice selected"),
  onEvilPress = () => console.log("Evil choice selected"),
  tabBarHeight = 80, // Pass the tab bar height as a prop
}: FantasyChoiceButtonProps) => {
  const [hoveredSection, setHoveredSection] = useState<"good" | "evil" | null>(null);
  const [goodScale] = useState(new Animated.Value(1));
  const [evilScale] = useState(new Animated.Value(1));
  const primaryColor = useThemeColor({}, "buttonGood");
  const evilColor = useThemeColor({}, "buttonEvil");
  const { height: windowHeight } = useWindowDimensions();

  // Calculate available height (screen height minus tab bar)
  const availableHeight = Math.max(windowHeight - tabBarHeight, 480);

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
      height: availableHeight,
      minHeight: 480,
      backgroundColor: "#1a1a1a",
      paddingBottom: 0, // Let the tab bar handle its own spacing
    },
    section: {
      flex: 1,
      overflow: "hidden",
    },
    touchable: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    choiceImage: {
      transform: [{ scale: 1.55 }, { translateY: -100 }],
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.32)",
    },
    defaultOverlay: {
      backgroundColor:
        "rgba(" +
        String(
          hexToRgb(evilColor)
        ) +
        ", 0.1)",
    },
    goodOverlayActive: {
      backgroundColor:
        "rgba(" +
        String(
          hexToRgb(primaryColor)
        ) +
        ", 0.3)", // Blue overlay
    },
    evilOverlayActive: {
      backgroundColor:
        "rgba(" +
        String(
          hexToRgb(evilColor)
        ) +
        ", 0.3)", // Red overlay
    },
    text: {
      fontSize: Math.min(56, Math.max(36, availableHeight * 0.07)),
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
      fontSize: Math.min(20, Math.max(16, availableHeight * 0.024)),
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
              imageStyle={styles.choiceImage}
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
              imageStyle={styles.choiceImage}
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
