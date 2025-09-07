# 🎴 Good or Bad

**Good or Bad** est une application où le joueur tire des cartes qui détermineront sa journée.  
L’idée est simple : chaque jour, le hasard vous réserve une bonne ou une mauvaise surprise… ⚡

---

## 🕹️ Règles du jeu

1. L’utilisateur lance une **session de tirage**.  
2. Il pioche **5 cartes** (chaque carte a 50% de chance d’être "Bonne" ou "Mauvaise").  
3. Une fois les 5 cartes révélées, le joueur choisit **une carte au hasard parmi les 5**.  
4. Cette carte finale définit son **destin de la journée**.  
5. En plus, une **carte quotidienne** (daily card) est disponible.

---

## 🛠️ Stack technique

### 📱 Frontend
- **React Native (Expo)**  
- **NativeWind** (Tailwind CSS adapté à React Native)  
- **TypeScript**

### 🌐 Backend
- **Node.js + Express**  
- **TypeScript**  
- **Prisma ORM** (gestion de la base de données)  
- **PostgreSQL**  
- **Zod** (validation des données)  
- **express-rate-limit** + **CORS** (sécurité & middleware)  

### ⚙️ Infrastructure
- **VPS Hostinger** (hébergement backend)  
- **PM2** (gestion des process en production)  
- **GitHub** (code source & versioning)

---
