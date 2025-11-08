# Screen Recording Guide for Windows

## Option 1: Windows Built-in Screen Recorder (Easiest - Windows 11)

### Steps:
1. **Press `Win + G`** to open Xbox Game Bar
2. Click the **Record** button (or press `Win + Alt + R` to start recording)
3. Record your screen
4. Press `Win + Alt + R` again to stop recording
5. Video is saved to: `C:\Users\YourName\Videos\Captures`

**Note:** If Game Bar doesn't open, enable it:
- Settings → Gaming → Xbox Game Bar → Turn ON

---

## Option 2: Windows Snipping Tool (Windows 11)

### Steps:
1. **Press `Win + Shift + S`** to open Snipping Tool
2. Select **"Screen recording"** option (if available)
3. Select area to record
4. Click **Record** button
5. Stop recording when done
6. Video is saved automatically

---

## Option 3: OBS Studio (Free, Professional)

### Download:
- Go to: https://obsproject.com/
- Download and install OBS Studio

### Setup:
1. Open OBS Studio
2. Click **"+"** under Sources → Select **"Display Capture"**
3. Click **"Start Recording"** button
4. Click **"Stop Recording"** when done
5. Video saved to: `C:\Users\YourName\Videos\`

---

## Option 4: PowerPoint Screen Recording (If you have Office)

### Steps:
1. Open PowerPoint
2. Go to **Insert** tab → **Screen Recording**
3. Select area to record
4. Click **Record** button
5. Stop recording
6. Right-click video → **Save Media As**

---

## Option 5: QuickTime (If you have Mac) or ShareX (Windows)

### ShareX (Free):
- Download: https://getsharex.com/
- Press `Ctrl + Shift + Print Screen` to start recording
- Press again to stop

---

## Recommended Recording Flow:

### 1. Start Recording
- Use **Windows Game Bar** (`Win + G` → Record)

### 2. Show Kubernetes Resources
```powershell
kubectl get pods -n ticketing-system
kubectl get svc -n ticketing-system
kubectl describe deployment payment-service -n ticketing-system
```

### 3. Show Port Forward
- Switch to the other PowerShell window showing port-forward running

### 4. Run API Calls
```powershell
.\run-api-calls.ps1
```

### 5. Show Results
- Let the script complete
- Show the payment responses

### 6. Stop Recording
- Press `Win + Alt + R` to stop

---

## Tips for Better Recording:

1. **Full Screen Terminal** - Make PowerShell full screen for better visibility
2. **Clear Screen** - Use `cls` before each command
3. **Slow Down** - Pause between commands so viewers can read
4. **Highlight Important Parts** - Use mouse cursor to point at key information
5. **Good Resolution** - Record at least 1080p
6. **Audio** - You can add voice narration explaining what you're doing

---

## What to Record:

### Minimum Required:
1. ✅ `kubectl get pods -n ticketing-system` - All pods running
2. ✅ `kubectl get svc -n ticketing-system` - Services
3. ✅ Port-forward running
4. ✅ API calls executing (`.\run-api-calls.ps1`)
5. ✅ Successful payment creation response

### Optional but Good:
- `kubectl logs` showing application logs
- `kubectl describe deployment` showing configuration
- Multiple API calls showing different endpoints

---

## Quick Start (Windows 11):

1. **Open PowerShell** (full screen)
2. **Press `Win + G`** → Click **Record** button
3. **Run commands:**
   ```powershell
   kubectl get pods -n ticketing-system
   kubectl get svc -n ticketing-system
   .\run-api-calls.ps1
   ```
4. **Press `Win + Alt + R`** to stop recording
5. **Find video** in `C:\Users\YourName\Videos\Captures`

---

## File Size Tips:

- **Short recordings** (2-5 minutes) are better than long ones
- **Focus on key moments** - Don't record everything
- **Compress if needed** - Use HandBrake or similar tools if file is too large

---

## Submission Format:

- **Format:** MP4 (most compatible)
- **Duration:** 2-5 minutes is ideal
- **Content:** Show the complete flow from pods → services → API calls → results

