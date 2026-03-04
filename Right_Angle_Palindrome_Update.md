# Palindrome Game - Complete Rules & Logic Guide

## Game Overview
Palindrome is a puzzle game where players place colored tiles on a grid to create palindromic sequences. A palindrome is a sequence that reads the same forwards and backwards (e.g., Blue-Red-Blue).

---

## Board Layout

- **Grid Size:** 11x11 cells
- **Center Cross:** The word "PALINDROME" appears in the center (both horizontally and vertically), acting as blocked tiles
- **Bulldogs:** 5 special bulldog tokens appear randomly on the board each game

---

## Game Start - Initial Setup

At the beginning of each game, 3 tiles are pre-placed on the board in specific positions. The game randomly selects between two starting configurations:

### 3-Color Start (50% chance)
- Three different colors are placed
- **Challenge:** Player must create a **5-tile palindrome** before making shorter ones
- **Strategy:** Typically requires placing 2 tiles to complete a palindrome

### 2-Color Start (50% chance)  
- Two colors placed (one color appears twice, creating an A-B-A pattern)
- **Challenge:** Player must create a **4-tile palindrome** before making shorter ones
- **Strategy:** May only require placing 1 tile to complete a palindrome

---

## How to Create Palindromes

### Traditional (Straight-Line) Palindromes
Place tiles in a row or column to create a sequence that reads the same from both ends.

**Examples:**
- Blue-Red-Blue (3 tiles) = 3 points
- Blue-Red-Red-Blue (4 tiles) = 4 points  
- Blue-Red-Green-Red-Blue (5 tiles) = 5 points

### Right-Angle Palindromes (NEW)
Place a tile at the intersection where both the **row** and **column** form palindromes simultaneously.

**How it works:**
- When you place a tile that completes both a horizontal AND vertical palindrome
- The game counts all unique tiles involved
- The center tile (your placed tile) is only counted once

**Example:**
- Row palindrome: 3 tiles (Blue-Red-Blue)
- Column palindrome: 3 tiles (Blue-Red-Blue)
- Right-angle count: 3 + 3 - 1 = **5 unique tiles** = 5 points

---

## Scoring System

### Base Points
| Palindrome Length | Points Earned | Feedback Message |
|-------------------|---------------|------------------|
| 3 tiles | 3 points | "GOOD!" (green) |
| 4 tiles | 4 points | "GREAT!" (blue) |
| 5 tiles | 5 points | "AMAZING!" (purple) |
| 6+ tiles | 5 points* | "LEGENDARY!" (pink) |

*Points are capped at 5 for lengths over 5, but the "LEGENDARY!" message shows for 6+

### Bulldog Bonus
If your palindrome includes any bulldog tiles:
- **+10 bonus points** added to your score
- Example: 5-tile palindrome with bulldog = 5 + 10 = 15 points

### Clicking Bulldogs
You can click on bulldog tiles directly to:
- Instantly gain **5 points**
- The bulldog relocates to a new random position

---

## Progressive Difficulty Rules

The game enforces a progression system where you must build longer palindromes before shorter ones:

### Phase 1: First Palindrome (Required)
- **3-color start:** Must create 5-tile palindrome first
- **2-color start:** Must create 4-tile palindrome first
- **Right-angle option:** Two intersecting 3-tile palindromes count as 5 tiles!

### Phase 2: Second Palindrome
After completing the required first palindrome:
- You may create a **4-tile palindrome**
- Or continue making 5-tile palindromes

### Phase 3: Free Play
After completing both 5-tile and 4-tile palindromes:
- You may create **3-tile palindromes** (minimum allowed)
- All palindrome lengths are now valid

---

## Forced Move System

The game helps players by identifying when a valid palindrome move exists:

1. **Detection:** If a palindrome of the required length can be made, the game recognizes it
2. **Wrong Move Warning:** If you try to place a tile that doesn't create the required palindrome:
   - Error sound and haptic feedback
   - Wrong try counter increases
3. **Three Strikes Rule:** After 3 wrong attempts:
   - If you have hints available: One hint is used to show you a valid move
   - If no hints: A "no hints" face appears (¬_¬)

---

## Hints System

- **Starting Hints:** 2 hints per game
- **Using Hints:** Tap the "Hints" box to highlight a valid move
- **Hint Duration:** 3 seconds
- **Visual:** The suggested cell glows with the recommended color

---

## Game Modes

### Single Player
- Timer counts up from 00:00
- Play at your own pace
- Try to achieve the highest score

### Multiplayer
- 5-minute game timer (counts down)
- 15-second first move countdown (must make a move or forfeit)
- Real-time score updates show opponent's progress
- Game ends when timer reaches 0 or all tiles are placed

---

## Visual Feedback

### Palindrome Created
Colorful text appears on screen:
- **Green "GOOD!"** - 3 tiles
- **Blue "GREAT!"** - 4 tiles
- **Purple "AMAZING!"** - 5 tiles
- **Pink "LEGENDARY!"** - 6+ tiles

### Invalid Move
- Error sound plays
- Haptic feedback (vibration)
- Tile placement rejected

### Valid Placement
- Drop sound plays
- Subtle haptic feedback

---

## Interaction Modes

Players can choose their preferred control method in Settings:

### Drag and Drop
- Drag colored blocks from the palette onto the board
- Default mode for mobile

### Pick and Drop
- Tap a cell on the board first (selects target)
- Then tap a color from the palette to place it
- Alternative mode for precision placement

---

## Accessibility Features

### Color Blind Mode
Available in Settings with 4 options:
- **Symbols:** ● ▲ ■ ◆ ★
- **Emojis:** 🍓 🥑 🫐 🖤 🍋
- **Cards:** ♥ ♣ ♦ ♠ ★
- **Letters:** A B C D E

### Sound & Haptics
- Sound effects can be toggled on/off
- Haptic feedback can be toggled on/off
- Independent controls for each

---

## Platform Availability

All features are available on:
- **Mobile App** (iOS/Android)
- **Web Version** (browser)

Game progress and settings sync across platforms when logged in.

---

## Tips for Success

1. **Study the Initial Board** - Look at the 3 pre-placed tiles to determine if you have a 2-color or 3-color start
2. **Plan Your First Move** - Identify where to place tiles to create the required 4 or 5-tile palindrome
3. **Look for Right-Angle Opportunities** - Sometimes placing one tile can create two palindromes at once
4. **Use Bulldogs Wisely** - Clicking them gives 5 points, but including them in palindromes gives +10 bonus
5. **Save Hints for Emergencies** - You only get 2 per game
6. **Watch the Timer** - In multiplayer, the 15-second first move countdown is strict

---

## Summary of Recent Updates

### Right-Angle Palindrome Support
- Game now recognizes when placed tiles create palindromes in both row and column directions
- Combined unique tile count determines score
- Satisfies first-move requirements (e.g., 3+3-1=5 tiles counts as a 5-tile palindrome)

### Enhanced Scoring
- Right-angle palindromes score based on total unique tiles
- Bulldog bonuses apply to all palindrome types
- Visual feedback for all scoring events
