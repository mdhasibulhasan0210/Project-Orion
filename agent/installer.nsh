; Custom NSIS installer script for Orion Agent
; This file is included by electron-builder to customize the NSIS installer.

!macro customHeader
  !system "echo Building Orion Agent Installer..."
!macroend

!macro customInit
  ; Check if already installed and running
  FindWindow $0 "" "Orion Agent"
  StrCmp $0 0 notRunning
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "Orion Agent is currently running. Please close it before installing." IDOK continueInstall
    Abort
  continueInstall:
    ; Kill the process
    ExecWait 'taskkill /F /IM "Orion Agent.exe"'
  notRunning:
!macroend

!macro customInstall
  ; Create desktop shortcut with custom icon
  CreateShortCut "$DESKTOP\Orion Agent.lnk" "$INSTDIR\Orion Agent.exe" "" "$INSTDIR\Orion Agent.exe" 0
!macroend

!macro customUnInstall
  ; Clean up on uninstall
  Delete "$DESKTOP\Orion Agent.lnk"
  Delete "$SMPROGRAMS\Orion Agent\Orion Agent.lnk"
  RMDir "$SMPROGRAMS\Orion Agent"
!macroend
