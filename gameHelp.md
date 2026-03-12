# Color Palindrome Game

## Complete Game Specification & Logic Engine

---

# 1. Game Overview

The **Color Palindrome Game** is a puzzle board game where players place colored counters on a grid to form **palindromes of colors**.

A **palindrome** is a sequence that reads the same **forwards and backwards**.

Example:

```
Blue → Green → Red → Green → Blue
```

Reversed:

```
Blue → Green → Red → Green → Blue
```

The objective of the game is to:

```
Place counters to continuously create valid palindromes
until all counters are used.
```

The game supports **solo puzzle play** but can be extended to multiplayer.

---

# 2. Board Specification

## Board Size

```
11 × 11 grid
Total cells: 121
```

Each cell may contain:

```
Empty
or
One colored counter
```

---

# 3. Coordinate System

Recommended coordinate system:

```
x-axis: 0 → 10
y-axis: 0 → 10
```

Top-left corner:

```
(0,0)
```

Bottom-right corner:

```
(10,10)
```

Center of board:

```
(5,5)
```

---

# 4. Board Layout

The board contains a **cross shape formed by the word "PALINDROME"**.

## Horizontal axis

```
P A L I N D R O M E
```

## Vertical axis

```
P
A
L
I
N
D
R
O
M
E
```

Intersection occurs at:

```
(5,5)
```

The cross visually represents the **symmetry principle of palindromes**.

---

# 5. Special Squares

Several squares on the board display a **graduation cap icon**.

These squares appear in **symmetrical positions** around the board.

Example approximate positions:

```json
[
 { "x":3,"y":3 },
 { "x":7,"y":3 },
 { "x":1,"y":5 },
 { "x":9,"y":5 },
 { "x":3,"y":7 },
 { "x":7,"y":7 },
 { "x":5,"y":1 },
 { "x":5,"y":9 }
]
```

These squares may later be used for:

* bonus scoring
* puzzle mechanics
* visual theme

Currently they do not change gameplay rules.

---

# 6. Game Components

## Counters

Players place colored counters on the board.

Example colors:

```
Blue
Green
Red
```

The total number of counters mentioned in the rules:

```
Approximately 80 counters
```

Each counter contains:

```
color
position (x,y)
```

Example data object:

```json
{
 "x": 5,
 "y": 5,
 "color": "green"
}
```

---

# 7. Initial Game Setup

The game begins with **three counters already placed horizontally**.

Rules:

```
3 counters
3 different colors
placed horizontally
```

Example:

```
Blue | Green | Red
```

Example coordinates:

```json
[
 { "x":4,"y":5,"color":"blue" },
 { "x":5,"y":5,"color":"green" },
 { "x":6,"y":5,"color":"red" }
]
```

---

# 8. First Move Rule

At the start of the game the player may place **two additional counters** to create the first palindrome.

Example progression:

Start:

```
Blue | Green | Red
```

Add counters:

```
Green
Blue
```

Result:

```
Blue | Green | Red | Green | Blue
```

This forms a **5-counter palindrome**.

---

# 9. Definition of a Palindrome

A sequence of colors is a palindrome when:

```
sequence[i] == sequence[length - i - 1]
```

Example valid palindrome:

```
Red | Green | Blue | Green | Red
```

Example invalid sequence:

```
Red | Blue | Green
```

---

# 10. Allowed Palindrome Sizes

Palindromes must contain an **odd number of counters**.

Allowed sizes include:

```
3
5
7
9
11
...
```

Examples:

### 3-counter palindrome

```
Green | Red | Green
```

### 5-counter palindrome

```
Red | Green | Blue | Green | Red
```

### 9-counter palindrome

```
Red | Green | Blue | Green | Red | Green | Blue | Green | Red
```

The rules explicitly allow both **3-counter and 9-counter palindromes**.

---

# 11. Directions for Palindromes

Palindromes can form in:

```
Horizontal direction
Vertical direction
Right-angle direction
```

Diagonal palindromes are **not supported**.

---

# 12. Right-Angle Palindrome Rule

The most important rule of the game.

A palindrome may turn **once at a 90° angle**.

Example shape:

```
Blue Green Red Green Blue
                    |
                    |
                  Blue
```

Or:

```
    Blue
    Green
Blue Green Red Green Blue
```

Rules:

```
Only one right angle allowed
Sequence must remain symmetrical
Minimum length = 3 counters
```

This rule allows the board to expand with complex patterns.

---

# 13. Overlapping Palindromes

Counters may belong to **multiple palindromes simultaneously**.

Example:

```
Red Green Blue Green Red
        |
      Blue
```

The same counter may be part of several palindrome sequences.

---

# 14. Game Progression

Gameplay loop:

```
Player selects a board cell
Player places a colored counter
Game engine checks palindrome validity
If valid → move accepted
If invalid → move rejected
```

The board gradually fills with interlocking palindromes.

---

# 15. Game End Conditions

The game ends when:

```
All counters have been used
```

or

```
No valid moves remain
```

The goal in solo play is to **use all counters successfully**.

---

# 16. Data Structures

## Cell

```javascript
class Cell {
  x
  y
  counter = null
  special = false
}
```

---

## Counter

```javascript
class Counter {
  color
}
```

---

## Board

```javascript
class Board {
  size = 11
  cells = []
}
```

---

# 17. Palindrome Detection Algorithm

Basic palindrome check:

```javascript
function isPalindrome(arr){

  let left = 0
  let right = arr.length - 1

  while(left < right){

    if(arr[left] !== arr[right])
      return false

    left++
    right--
  }

  return true
}
```

---

# 18. Straight Palindrome Detection

Check sequences horizontally and vertically.

Example algorithm:

```javascript
function checkStraight(board,x,y){

  checkHorizontal(board,x,y)
  checkVertical(board,x,y)

}
```

---

# 19. Right-Angle Palindrome Detection Engine

Possible direction combinations:

```
LEFT + UP
LEFT + DOWN
RIGHT + UP
RIGHT + DOWN
```

These represent the four possible L-shapes.

---

## Right Angle Algorithm

1. Treat the placed counter as a **pivot**.
2. Expand both arms equally.
3. Compare colors symmetrically.
4. Continue until mismatch or board edge.

---

## JavaScript Implementation

```javascript
function checkRightAnglePalindrome(board, x, y) {

  const directions = [
    {a:[-1,0], b:[0,-1]},
    {a:[-1,0], b:[0,1]},
    {a:[1,0], b:[0,-1]},
    {a:[1,0], b:[0,1]}
  ]

  const pivotColor = board[y][x]

  for (let dir of directions) {

    let armA = dir.a
    let armB = dir.b

    let distance = 1
    let sequence = [pivotColor]

    while (true) {

      let ax = x + armA[0] * distance
      let ay = y + armA[1] * distance

      let bx = x + armB[0] * distance
      let by = y + armB[1] * distance

      if (!insideBoard(board, ax, ay)) break
      if (!insideBoard(board, bx, by)) break

      let colorA = board[ay][ax]
      let colorB = board[by][bx]

      if (!colorA || !colorB) break

      sequence.unshift(colorA)
      sequence.push(colorB)

      if (isPalindrome(sequence) && sequence.length >= 3)
        return true

      distance++
    }
  }

  return false
}
```

---

# 20. Helper Functions

### Board boundary check

```javascript
function insideBoard(board,x,y){

  return (
    y >= 0 &&
    y < board.length &&
    x >= 0 &&
    x < board[0].length
  )

}
```

---

# 21. Move Validation

Final validation logic:

```javascript
function validateMove(board,x,y,color){

  board[y][x] = color

  if(checkStraight(board,x,y)) return true
  if(checkRightAnglePalindrome(board,x,y)) return true

  board[y][x] = null

  return false
}
```

---

# 22. Performance

Board size:

```
11 × 11
```

Maximum checks per move:

```
4 right-angle directions
~5 expansion steps
```

This makes the algorithm **very fast**, even on mobile devices.

---

# 23. UI Implementation Suggestion

CSS grid layout:

```css
.board {
  display: grid;
  grid-template-columns: repeat(11, 50px);
  grid-template-rows: repeat(11, 50px);
}
```

Each cell:

```
clickable
stores counter color
updates board state
```

---

# 24. Game Objective

The player aims to:

```
Create palindromes
Expand patterns across the board
Use all counters
Master palindrome patterns
```

The puzzle grows more complex as the board fills.

---

# 25. Possible Future Enhancements

```
Score system
AI solver
Puzzle levels
Multiplayer version
Hint system
Animations
Mobile app version
```

---

# End of Document
