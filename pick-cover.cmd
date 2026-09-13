@echo off
rem Double-click to open the cover picker (scripts/pick-cover.mjs, docs/DECISIONS.md D160).
rem It opens on /home; change route from the menu in the picker window.
rem Any arguments are passed through, e.g. pick-cover.cmd --routes=consent
cd /d "%~dp0"
node scripts/pick-cover.mjs %*
echo.
echo Picker closed. Verified shots are in .screenshots\picked\
pause
