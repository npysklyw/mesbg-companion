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

## Development cloud backup

The Library shows an unauthenticated **Back up** action only when
`EXPO_PUBLIC_API_URL` is configured. Local JSON remains the source of truth.

1. Start PostgreSQL and FastAPI from `server/`:

   ```sh
   docker compose up --build
   ```

   The API listens on `0.0.0.0:8000` inside the container and is exposed on
   port 8000. For a local Python run, use
   `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

2. Find the Windows computer's LAN IPv4 address with `ipconfig`. Copy
   `.env.example` to `.env.local` and replace the example address:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
   ```

   A physical device cannot use `localhost` because that points to the device.
   Keep the device and computer on the same network, allow port 8000 through
   Windows Firewall, and include the LAN Expo Web origin in `CORS_ORIGINS` when
   testing through a browser.

3. Restart Expo after changing the environment variable:

   ```sh
   npx expo start
   ```

This development endpoint has no authentication and must not be exposed to the
public internet.

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
