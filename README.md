# MESBG Army Builder

A mobile app for building and managing armies for the [Middle-earth Strategy Battle Game (MESBG)](https://www.warhammer.com/en-GB/middle-earth-lp?srsltid=AfmBOoqF0tVA4gDURWAuOWQ2P9HSGjMKb94V3g-6HLc1D9luBdupCK1F) by Games Workshop.

## Demo



<!-- Or embed a YouTube video: -->

[![Watch the demo](https://img.youtube.com/vi/wost05aqULY/maxresdefault.jpg)](https://youtu.be/wost05aqULY)


## Features

- **Create and edit armies** for MESBG
- **Add heroes** and customize their wargear
- **Build warbands** with warriors and wargear options
- **Track points** and model counts
- **Save and load** your armies (JSON-based, local storage)
- **Modern UI** with light/dark theme support

## Tech Stack

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [@rneui/base](https://reactnativeelements.com/)
- TypeScript

## Getting Started

1. **Clone the repo:**

   ```sh
   git clone https://github.com/yourusername/mesbg-comp.git
   cd mesbg-comp
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Run the app:**

   ```sh
   npx expo start
   ```

4. **Open on your device:**
   - Use the Expo Go app (iOS/Android) or an emulator.

## Project Structure

- `/app/(tabs)/armyBuilder.tsx` — Main army builder logic and state
- `/components/ui/Hero.tsx` — Hero display and editing
- `/components/ui/Warrior.tsx` — Warrior display and editing
- `/components/ThemedText.tsx` — Themed text component
- `/assets/fonts/` — Custom fonts

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

## License

This project is not affiliated with or endorsed by Games Workshop.  
For personal use only.

---

**Middle-earth Strategy Battle Game** is a trademark of Games Workshop.
