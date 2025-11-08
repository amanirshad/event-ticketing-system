# How to Record PowerShell Window Correctly

## Problem:
Recording captured the document window instead of PowerShell.

## Solution 1: Record Full Screen (Easiest)

### Steps:
1. **Make PowerShell full screen** (Press `F11` or maximize window)
2. **Press `Win + Alt + R`** to start recording
3. This records your entire screen, including PowerShell
4. Run your commands
5. Press `Win + Alt + R` again to stop

---

## Solution 2: Select Specific Window

### Using Windows Snipping Tool:
1. **Press `Win + Shift + S`**
2. Click **"Screen recording"** icon (video camera)
3. **Drag to select the PowerShell window** (or full screen)
4. Click **Record**
5. Run your commands
6. Click **Stop** when done

---

## Solution 3: Record Window Only (OBS Studio)

### If you have OBS:
1. Open OBS Studio
2. Add **"Window Capture"** source
3. Select **"PowerShell"** window
4. Click **Start Recording**
5. Run commands
6. Click **Stop Recording**

---

## Best Practice Setup:

### Before Recording:
1. **Close unnecessary windows** (document, browser, etc.)
2. **Make PowerShell full screen** (`F11` or maximize)
3. **Clear screen** (`cls` command)
4. **Arrange windows:**
   - PowerShell window (main) - full screen
   - Port-forward window (small, minimized or on side)

### During Recording:
1. **Start recording** (`Win + Alt + R`)
2. **Show PowerShell window** (make sure it's visible)
3. Run commands
4. **Switch to port-forward window** briefly (if needed)
5. **Back to PowerShell** for API calls
6. Stop recording

---

## Quick Fix Right Now:

### Method 1: Full Screen Recording
1. **Make PowerShell full screen** (`F11`)
2. **Press `Win + Alt + R`** to start
3. Run your commands
4. Press `Win + Alt + R` to stop

### Method 2: Window Selection
1. **Press `Win + Shift + S`**
2. Click **"Screen recording"**
3. **Drag to select PowerShell window** (make it big!)
4. Click **Record**
5. Run commands
6. Click **Stop**

---

## Pro Tips:

1. **Hide other windows** - Close document, browser, etc. before recording
2. **Full screen PowerShell** - Makes it easier to see and record
3. **Test first** - Do a quick 5-second test recording to verify it's capturing PowerShell
4. **Use two monitors** - If available, put PowerShell on one screen, record that screen
5. **Increase font size** - Make PowerShell text bigger for better visibility in recording

---

## Recommended Setup:

```
┌─────────────────────────────────┐
│   PowerShell (FULL SCREEN)      │  ← Record this!
│                                 │
│   kubectl get pods...           │
│   .\run-api-calls.ps1          │
│                                 │
└─────────────────────────────────┘

┌──────────────┐
│ Port-forward │  ← Small window, switch to briefly
│ (minimized)  │
└──────────────┘
```

---

## Quick Steps:

1. **Close document window** (or minimize it)
2. **Make PowerShell full screen** (`F11`)
3. **Press `Win + Alt + R`** to start recording
4. **Verify** - You should see recording indicator
5. **Run commands** in PowerShell
6. **Stop recording** (`Win + Alt + R`)

---

## If Still Not Working:

### Use OBS Studio (Free):
1. Download: https://obsproject.com/
2. Add **"Display Capture"** source
3. Select your **main monitor**
4. Click **Start Recording**
5. Make sure PowerShell is visible on that monitor
6. Run commands
7. Stop recording

This will definitely capture PowerShell!

