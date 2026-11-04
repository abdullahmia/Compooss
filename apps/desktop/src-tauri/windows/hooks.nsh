; The installer can't replace files while the bundled server runs, and stale
; server files from an older version must not mix with new ones (tauri#15134).

!macro NSIS_HOOK_PREINSTALL
  nsExec::Exec 'taskkill /F /T /IM compooss-node.exe'
  RMDir /r "$INSTDIR\server"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::Exec 'taskkill /F /T /IM compooss-node.exe'
!macroend
