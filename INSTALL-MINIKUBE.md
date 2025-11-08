# Installing Minikube on Windows

## Prerequisites Check

✅ **kubectl** - Already installed (v1.34.1)
❌ **Minikube** - Needs to be installed
✅ **Docker** - Should be installed (check with `docker --version`)

## Installation Methods

### Method 1: Using Chocolatey (Easiest - Recommended)

1. **Install Chocolatey** (if not already installed):
   - Open PowerShell as Administrator
   - Run:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install Minikube**:
   ```powershell
   choco install minikube
   ```

3. **Verify Installation**:
   ```powershell
   minikube version
   ```

### Method 2: Using Direct Download

1. **Download Minikube**:
   - Visit: https://minikube.sigs.k8s.io/docs/start/
   - Download the Windows installer (`.exe` file)

2. **Install**:
   - Run the downloaded installer
   - Follow the installation wizard
   - Make sure to add Minikube to PATH

3. **Verify Installation**:
   ```powershell
   minikube version
   ```

### Method 3: Using winget (Windows Package Manager)

```powershell
winget install Kubernetes.minikube
```

### Method 4: Manual Installation

1. **Download Minikube binary**:
   - Go to: https://github.com/kubernetes/minikube/releases
   - Download `minikube-windows-amd64.exe`
   - Rename it to `minikube.exe`

2. **Add to PATH**:
   - Copy `minikube.exe` to a folder (e.g., `C:\minikube`)
   - Add that folder to your system PATH:
     - Right-click "This PC" → Properties → Advanced System Settings
     - Click "Environment Variables"
     - Under "System Variables", find "Path" and click "Edit"
     - Click "New" and add `C:\minikube` (or your chosen folder)
     - Click OK on all dialogs

3. **Verify Installation**:
   ```powershell
   minikube version
   ```

## After Installation

### Start Minikube

```powershell
minikube start
```

**Note:** First start may take several minutes as it downloads the Kubernetes image.

### Verify Minikube is Running

```powershell
minikube status
```

Expected output:
```
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

### Check Kubernetes Cluster

```powershell
kubectl get nodes
```

Expected output:
```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1m    v1.x.x
```

## Troubleshooting

### If Minikube Start Fails

1. **Check Docker**:
   ```powershell
   docker version
   ```
   Minikube requires Docker Desktop or another container runtime.

2. **Start with specific driver**:
   ```powershell
   minikube start --driver=docker
   ```

3. **Check system requirements**:
   - At least 2 CPUs
   - At least 2GB RAM
   - 20GB free disk space

### If PATH Issues Persist

1. **Close and reopen PowerShell** after adding to PATH
2. **Restart your computer** if needed
3. **Check PATH**:
   ```powershell
   $env:Path -split ';' | Select-String minikube
   ```

## Next Steps

Once Minikube is installed and running:

1. **Navigate to project**:
   ```powershell
   cd C:\Projects\payment-service
   ```

2. **Run deployment script**:
   ```powershell
   .\deploy-minikube.ps1
   ```

## Alternative: Use Docker Desktop Kubernetes

If you have Docker Desktop installed, you can use its built-in Kubernetes instead:

1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Enable Kubernetes
4. Click "Apply & Restart"

Then update the deployment scripts to use `docker-desktop` context instead of Minikube.

