# ✅ Commands to Run for Recording

## Step 1: Show Kubernetes Resources
```powershell
kubectl get pods -n ticketing-system
kubectl get svc -n ticketing-system
```

## Step 2: Show Port-Forward Running
**In another PowerShell window:**
```powershell
kubectl port-forward svc/payment-service-nodeport 8080:3004 -n ticketing-system
```
*(Switch to this window to show it running)*

## Step 3: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/health" | ConvertTo-Json -Depth 3
```

## Step 4: Run API Calls
```powershell
cd C:\Projects\payment-service
.\run-api-calls.ps1
```

## Step 5: Show Results
- Let the script complete
- Show payment responses
- Show all API call results

---

## Complete Flow:

1. **Start Recording** (`Win + Alt + R`)
2. **Show Kubernetes** - Run Step 1 commands
3. **Show Port-Forward** - Switch to other window, show it running
4. **Back to Main Window** - Run Step 3 (Health Check)
5. **Run API Calls** - Run Step 4 (`.\run-api-calls.ps1`)
6. **Show Results** - Let script finish, show all outputs
7. **Stop Recording** (`Win + Alt + R`)

---

## Note:
- Red squiggly lines in your document are just spell-check, not errors
- Make sure you're in `C:\Projects\payment-service` directory
- Port-forward must be running in another window

