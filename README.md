# Villager Maker

A random villager generator for Cult of the Lamb using Spine animations.

## Features

- **Random Villager Generation**: Generates random followers with different forms, colors, and clothing
- **Spine Animations**: Uses the game's actual Spine skeleton for smooth animations
- **Death Animation**: Current villager plays death animation (1.2x speed) with grunt sound when rerolling
- **Spawn Animation**: New villager drops in with spawn animation and greet sound
- **Shuffle Animation**: After landing, shuffles through random variations before settling
- **Weighted Randomization**: Common forms appear more often, rare/DLC forms are less frequent

## Files

- `index.html` - Main page
- `app.js` - Application logic (reroll flow, sounds, initialization)
- `spine-renderer.js` - Spine WebGL rendering (animations, skins, colors)
- `villager-randomizer.js` - Random config generation with weighted categories
- `styles.css` - Styling with game-themed background
- `assets/` - Spine files (Follower.skel, .atlas, .png), font, background image
- `sounds/` - death.wav (grunt), spawn.wav (greet)
- `data/follower-data.json` - Form/clothing/color data
- `lib/spine-webgl.js` - Spine runtime

## How It Works

1. Page loads with a random villager displayed
2. Click "Re-roll" or press Space/Enter
3. Current villager plays death animation + sound
4. New random villager is generated
5. New villager spawns in with animation + sound
6. Shuffle through variations, then settle on final form

## Running Locally

```bash
cd /Users/ace/Tools/villager-maker
python3 -m http.server 8082
```

Then open http://localhost:8082

## Assets Source

- Spine files extracted from Cult of the Lamb game
- Sounds from cultivis project (extracted game audio)
- Background from Behance (Cult of the Lamb artwork)
