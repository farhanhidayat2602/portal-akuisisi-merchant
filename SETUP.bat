@echo off
title Setup Portal Akuisisi Merchant - Bank Mandiri
color 1F
echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║     PORTAL AKUISISI MERCHANT - BANK MANDIRI          ║
echo  ║              Setup Script v1.0                        ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js belum terinstall!
    echo.
    echo  Download Node.js LTS dari: https://nodejs.org
    echo  Pilih "Windows Installer (.msi)" versi LTS
    echo  Install, lalu jalankan file SETUP.bat ini kembali.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% ditemukan

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm tidak ditemukan!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo  [OK] npm v%NPM_VER% ditemukan
echo.

:: Install dependencies
echo  [1/4] Menginstall dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo  [ERROR] npm install gagal!
    pause
    exit /b 1
)
echo  [OK] Dependencies terinstall
echo.

:: Generate Prisma client
echo  [2/4] Generate Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo  [ERROR] Prisma generate gagal!
    pause
    exit /b 1
)
echo  [OK] Prisma client siap
echo.

:: Push database schema
echo  [3/4] Membuat database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo  [ERROR] Database push gagal!
    pause
    exit /b 1
)
echo  [OK] Database schema dibuat
echo.

:: Seed database
echo  [4/4] Mengisi data merchant (96+ merchants, 27 cabang)...
call npm run db:seed
if %errorlevel% neq 0 (
    echo  [ERROR] Seed database gagal!
    pause
    exit /b 1
)
echo  [OK] Database berhasil diisi
echo.

echo  ╔═══════════════════════════════════════════════════════╗
echo  ║              SETUP SELESAI!                           ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║  Jalankan: npm run dev                                ║
echo  ║  Buka browser: http://localhost:3000                  ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║  LOGIN:                                               ║
echo  ║  Sales  → demo / mandiri123                           ║
echo  ║  Admin  → admin / admin2024                           ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.
echo  Tekan sembarang tombol untuk menjalankan server...
pause >nul

:: Start dev server
npm run dev
