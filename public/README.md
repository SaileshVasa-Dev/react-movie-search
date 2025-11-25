# 🎬 Movies Browser - React + TMDB + Vite

A modern movie browsing web app built using **React**, **Vite**, **Tailwind CSS**, and **TMDB API**.  
It supports **multi-layer searching**, **language filtering**, **calendar-based release filtering**,  
and **client-side pagination** with a clean UI.

🚀 **Live Demo:** _Coming after Netlify deployment_  
📦 **GitHub Repository:** _Uploaded by user_

---

## ⚡ Features

### 🔍 Advanced Multi-Word Search  
- Search matches **title**, **original title**, or **overview**  
- Supports strict multi-word search  
- Example: typing `family ci` correctly shows “Family Circus”

### 🌐 Language Filtering  
- Filter movies by language (ex: Telugu, Hindi, Tamil, English…)
- Searchable language dropdown

### 📅 Release Month Filter  
- Custom calendar-style year + month selector  
- Select:
  - **Year only**
  - **Year + Month**
  - Toggle month to remove it  
- Visual UI with highlighting

### 📄 Pagination  
- Client-side pagination (20 movies per page)
- Next/Previous navigation

### 🚀 Auto Fetching Logic  
- Pulls from:
  - TMDB Trending (default)
  - TMDB Discover (when filters enabled)
  - TMDB Search (when search text entered)
- Merges results and removes duplicates

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|----------|
| **React** | Frontend framework |
| **Vite** | Fast development & build |
| **Tailwind CSS** | UI styling |
| **TMDB API** | Movie data |
| **Axios** | API calls |
| **Netlify** | Deployment |

---

## 📂 Folder Structure

