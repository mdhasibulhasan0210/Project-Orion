const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, safeStorage, shell } = require('electron');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const si = require('systeminformation');
const { machineIdSync } = require('node-machine-id');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

// Firebase imports
const { initializeApp } = require('firebase/app');
const {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} = require('firebase/auth');
const {
  getFirestore, doc, setDoc, onSnapshot, updateDoc,
  addDoc, collection, serverTimestamp, getDoc
} = require('firebase/firestore');

// ─── Firebase Config ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDW6Niv0-Ol65RsZ0tUzPT8e5gXLfpKTRs",
  authDomain: "orion-ai-87220.firebaseapp.com",
  projectId: "orion-ai-87220",
  storageBucket: "orion-ai-87220.firebasestorage.app",
  messagingSenderId: "928645630976",
  appId: "1:928645630976:web:c4bcbb16578b458b39dce5",
  measurementId: "G-2CRR1S7HJL"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ─── Secure Store ──────────────────────────────────────────────────────────────
const store = new Store({ name: 'orion-agent' });

// ─── State ─────────────────────────────────────────────────────────────────────
let tray = null;
let setupWindow = null;
let heartbeatInterval = null;
let commandUnsubscribe = null;
let statusUnsubscribe = null;
let currentUser = null;
const deviceId = machineIdSync({ original: true });

// ─── Auto Launch ────────────────────────────────────────────────────────────────
const autoLauncher = new AutoLaunch({
  name: 'Orion Agent',
  path: app.getPath('exe'),
});

// ─── Zod Schemas for IPC Validation ────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const CommandSchema = z.object({
  command: z.enum(['shutdown', 'restart', 'sleep', 'hibernate', 'lock', 'logoff',
    'screenshot', 'get-processes', 'kill-process', 'get-clipboard',
    'set-clipboard', 'speak', 'play-audio', 'get-files', 'get-drives',
    'get-system-info', 'run-terminal']),
  params: z.record(z.unknown()).optional()
});

// ─── Helper: safe exec ─────────────────────────────────────────────────────────
function runCmd(command) {
  return new Promise((resolve, reject) => {
    exec(command, { shell: 'powershell.exe' }, (err, stdout, stderr) => {
      if (err) reject(err.message || stderr);
      else resolve(stdout.trim());
    });
  });
}

// ─── Command Executor ──────────────────────────────────────────────────────────
async function executeCommand(commandId, cmdData) {
  let result = null;
  let error = null;

  try {
    // Validate schema
    const parsed = CommandSchema.safeParse(cmdData);
    if (!parsed.success) throw new Error('Invalid command payload');

    const { command, params } = parsed.data;

    switch (command) {
      // Power
      case 'shutdown':
        await runCmd('Stop-Computer -Force');
        result = { success: true };
        break;
      case 'restart':
        await runCmd('Restart-Computer -Force');
        result = { success: true };
        break;
      case 'sleep':
        await runCmd('Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState("Suspend", $false, $false)');
        result = { success: true };
        break;
      case 'hibernate':
        await runCmd('shutdown /h');
        result = { success: true };
        break;
      case 'lock':
        await runCmd('rundll32.exe user32.dll,LockWorkStation');
        result = { success: true };
        break;
      case 'logoff':
        await runCmd('shutdown /l');
        result = { success: true };
        break;

      // Screenshot
      case 'screenshot': {
        const screenshotPath = path.join(os.tmpdir(), `orion_shot_${Date.now()}.jpg`);
        await runCmd(`
          Add-Type -AssemblyName System.Windows.Forms;
          Add-Type -AssemblyName System.Drawing;
          $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
          $bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height);
          $g = [System.Drawing.Graphics]::FromImage($bmp);
          $g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size);
          $maxWidth = 1280;
          if ($bounds.Width -gt $maxWidth) {
            $ratio = $maxWidth / $bounds.Width;
            $newH = [int]($bounds.Height * $ratio);
            $thumb = New-Object System.Drawing.Bitmap($bmp, $maxWidth, $newH);
            $thumb.Save('${screenshotPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Jpeg);
          } else {
            $bmp.Save('${screenshotPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Jpeg);
          }
          $g.Dispose(); $bmp.Dispose();
        `);
        const fs = require('fs');
        const imgData = fs.readFileSync(screenshotPath);
        const base64 = `data:image/jpeg;base64,${imgData.toString('base64')}`;
        fs.unlinkSync(screenshotPath);
        result = { screenshot: base64, timestamp: Date.now() };
        break;
      }

      // Processes
      case 'get-processes': {
        const raw = await runCmd('Get-Process | Select-Object Name, Id, CPU, WorkingSet64 | ConvertTo-Json');
        result = { processes: JSON.parse(raw) };
        break;
      }
      case 'kill-process': {
        const pid = params?.pid;
        if (!pid) throw new Error('Missing pid');
        await runCmd(`Stop-Process -Id ${pid} -Force`);
        result = { success: true, pid };
        break;
      }

      // Clipboard
      case 'get-clipboard': {
        const text = await runCmd('Get-Clipboard');
        result = { text };
        break;
      }
      case 'set-clipboard': {
        const text = (params?.text || '').replace(/'/g, "''");
        await runCmd(`Set-Clipboard -Value '${text}'`);
        result = { success: true };
        break;
      }

      // TTS / Audio
      case 'speak': {
        const text = (params?.text || '').replace(/'/g, "''");
        await runCmd(`Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak('${text}')`);
        result = { success: true };
        break;
      }

      // File manager
      case 'get-drives': {
        const raw = await runCmd('Get-PSDrive -PSProvider FileSystem | Select-Object Name, Root, Used, Free | ConvertTo-Json');
        result = { drives: JSON.parse(raw) };
        break;
      }
      case 'get-files': {
        const dirPath = params?.path || 'C:\\';
        const raw = await runCmd(`Get-ChildItem -Path '${dirPath}' | Select-Object Name, PSIsContainer, Length, LastWriteTime | ConvertTo-Json`);
        result = { files: JSON.parse(raw || '[]'), path: dirPath };
        break;
      }

      // System info
      case 'get-system-info': {
        const [cpu, mem, disk, graphics, osInfo, net, battery] = await Promise.all([
          si.cpu(), si.mem(), si.fsSize(), si.graphics(), si.osInfo(),
          si.networkInterfaces(), si.battery()
        ]);
        result = {
          cpu: { brand: cpu.brand, cores: cpu.physicalCores, speed: cpu.speed },
          memory: { total: mem.total, free: mem.free, used: mem.used },
          disk,
          gpu: graphics.controllers,
          os: { platform: osInfo.platform, distro: osInfo.distro, release: osInfo.release },
          network: net,
          battery
        };
        break;
      }

      // Terminal
      case 'run-terminal': {
        const cmd = params?.cmd;
        if (!cmd) throw new Error('Missing cmd');
        const output = await runCmd(cmd);
        result = { output };
        break;
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (err) {
    error = String(err?.message || err);
    console.error(`[Orion] Command "${cmdData.command}" failed:`, error);
  }

  // Write result
  try {
    await setDoc(doc(db, 'commandResults', commandId), {
      commandId,
      deviceId,
      result,
      error,
      completedAt: Date.now()
    });
    await updateDoc(doc(db, 'commands', commandId), { status: error ? 'failed' : 'completed' });
  } catch (e) {
    console.error('[Orion] Failed to write command result:', e);
  }
}

// ─── Heartbeat ─────────────────────────────────────────────────────────────────
async function startHeartbeat(user) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  const statusRef = doc(db, 'deviceStatus', deviceId);

  const tick = async () => {
    try {
      const [cpu, mem, disk, osInfo, net, time] = await Promise.all([
        si.currentLoad(), si.mem(), si.fsSize(), si.osInfo(),
        si.networkInterfaces(), Promise.resolve(si.time())
      ]);

      const mainDisk = disk[0] || { use: 0 };
      const mainNet = (net || []).find(n => n.ip4 && n.ip4 !== '127.0.0.1') || { ip4: 'Unknown' };

      await setDoc(statusRef, {
        online: true,
        lastSeen: Date.now(),
        cpu: Math.round(cpu.currentLoad * 10) / 10,
        ram: Math.round((mem.used / mem.total) * 1000) / 10,
        disk: Math.round((mainDisk.use || 0) * 10) / 10,
        uptime: time.uptime,
        ip: mainNet.ip4,
        osVersion: osInfo.release,
        agentVersion: app.getVersion(),
        computerName: os.hostname()
      }, { merge: true });
    } catch (err) {
      console.error('[Orion] Heartbeat error:', err.message);
    }
  };

  await tick();
  heartbeatInterval = setInterval(tick, 5000);
}

// ─── Command Listener ──────────────────────────────────────────────────────────
function listenForCommands() {
  if (commandUnsubscribe) commandUnsubscribe();

  // Listen to the commands/{deviceId} doc (per spec: device watches this single doc)
  commandUnsubscribe = onSnapshot(
    collection(db, 'commands'),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.deviceId === deviceId && data.status === 'pending') {
            executeCommand(change.doc.id, data);
          }
        }
      });
    },
    (err) => console.error('[Orion] Command listener error:', err)
  );
}

// ─── Device Registration ───────────────────────────────────────────────────────
async function registerDevice(user) {
  await setDoc(doc(db, 'devices', deviceId), {
    userId: user.uid,
    computerName: os.hostname(),
    os: `Windows ${os.release()}`,
    agentVersion: app.getVersion(),
    addedAt: Date.now()
  }, { merge: true });

  // Register user doc
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
  }, { merge: true });

  console.log('[Orion] Device registered:', deviceId);
}

// ─── Setup Window ──────────────────────────────────────────────────────────────
function createSetupWindow() {
  if (setupWindow) { setupWindow.focus(); return; }

  setupWindow = new BrowserWindow({
    width: 440,
    height: 580,
    resizable: false,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  setupWindow.loadFile(path.join(__dirname, 'setup.html'));

  setupWindow.on('closed', () => {
    setupWindow = null;
  });
}

// ─── Tray ──────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const updateMenu = (isLoggedIn) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Orion Agent',
        enabled: false,
        icon: icon
      },
      { type: 'separator' },
      {
        label: isLoggedIn ? `Connected: ${os.hostname()}` : 'Not Connected',
        enabled: false
      },
      {
        label: 'Device ID',
        sublabel: deviceId.substring(0, 12) + '...',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Setup / Sign In',
        click: () => createSetupWindow(),
        visible: !isLoggedIn
      },
      {
        label: 'Open Dashboard',
        click: () => shell.openExternal('https://orion-ai-87220.firebaseapp.com'),
        visible: isLoggedIn
      },
      {
        label: 'Sign Out',
        click: async () => {
          await signOut(auth);
          clearCredentials();
          updateMenu(false);
          createSetupWindow();
        },
        visible: isLoggedIn
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => autoUpdater.checkForUpdatesAndNotify()
      },
      { type: 'separator' },
      {
        label: 'Quit Orion Agent',
        click: () => {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          if (commandUnsubscribe) commandUnsubscribe();
          // Mark offline before quit
          setDoc(doc(db, 'deviceStatus', deviceId), { online: false, lastSeen: Date.now() }, { merge: true })
            .finally(() => app.quit());
        }
      }
    ]);

    tray.setContextMenu(menu);
    tray.setToolTip(isLoggedIn ? `Orion Agent – ${os.hostname()} – Connected` : 'Orion Agent – Not Connected');
  };

  updateMenu(false);

  tray.on('double-click', () => {
    if (!currentUser) createSetupWindow();
    else shell.openExternal('https://orion-ai-87220.firebaseapp.com');
  });

  // Update menu when auth state changes
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateMenu(!!user);
  });
}

// ─── Credential Storage (safeStorage) ─────────────────────────────────────────
function saveCredentials(email, password) {
  if (safeStorage.isEncryptionAvailable()) {
    store.set('email', email);
    store.set('encryptedPassword', safeStorage.encryptString(password).toString('base64'));
  } else {
    // Fallback if safe storage not available
    store.set('email', email);
    store.set('password', password);
  }
}

function loadCredentials() {
  const email = store.get('email');
  let password = null;

  if (store.has('encryptedPassword')) {
    try {
      const enc = Buffer.from(store.get('encryptedPassword'), 'base64');
      password = safeStorage.decryptString(enc);
    } catch {
      password = store.get('password');
    }
  } else {
    password = store.get('password');
  }

  return { email, password };
}

function clearCredentials() {
  store.delete('email');
  store.delete('encryptedPassword');
  store.delete('password');
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('login', async (_event, rawData) => {
  const parsed = LoginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: 'Invalid email or password format.' };
  }

  const { email, password } = parsed.data;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    currentUser = user;

    // Save credentials securely
    saveCredentials(email, password);

    // Register device
    await registerDevice(user);

    // Start services
    await startHeartbeat(user);
    listenForCommands();

    if (setupWindow) setupWindow.close();

    return { success: true, email: user.email };
  } catch (err) {
    console.error('[Orion] Login failed:', err.code);
    const messages = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/invalid-credential': 'Invalid email or password.'
    };
    return { success: false, error: messages[err.code] || err.message };
  }
});

ipcMain.handle('get-device-id', () => deviceId);
ipcMain.handle('get-hostname', () => os.hostname());
ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('set-auto-launch', async (_event, enabled) => {
  try {
    if (enabled) await autoLauncher.enable();
    else await autoLauncher.disable();
    store.set('autoLaunch', enabled);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-auto-launch', async () => {
  try {
    return { enabled: await autoLauncher.isEnabled() };
  } catch {
    return { enabled: false };
  }
});

// ─── Auto Updater ──────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    tray?.displayBalloon?.({
      title: 'Orion Agent Update Available',
      content: `Version ${info.version} is downloading in the background.`,
      iconType: 'info'
    });
  });

  autoUpdater.on('update-downloaded', () => {
    tray?.displayBalloon?.({
      title: 'Orion Agent Update Ready',
      content: 'A new version will be installed when you quit.',
      iconType: 'info'
    });
  });

  autoUpdater.on('error', (err) => {
    console.warn('[Orion] Auto-updater error:', err.message);
  });

  // Check for updates every 6 hours
  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 6 * 60 * 60 * 1000);
  setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 10000);
}

// ─── App Ready ─────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Prevent app from closing when all windows close
  app.on('window-all-closed', (e) => e.preventDefault());

  createTray();
  setupAutoUpdater();

  // Enable auto-launch if previously set
  const autoLaunchPref = store.get('autoLaunch', false);
  if (autoLaunchPref) {
    autoLauncher.enable().catch(() => {});
  }

  // Try auto-login
  const { email, password } = loadCredentials();

  if (email && password) {
    try {
      console.log('[Orion] Auto-login for:', email);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      currentUser = cred.user;

      await registerDevice(currentUser);
      await startHeartbeat(currentUser);
      listenForCommands();

      console.log('[Orion] Started successfully as:', currentUser.email);
    } catch (err) {
      console.warn('[Orion] Auto-login failed:', err.code);
      clearCredentials();
      createSetupWindow();
    }
  } else {
    createSetupWindow();
  }
});

// ─── Prevent duplicate instances ───────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!currentUser) createSetupWindow();
  });
}
