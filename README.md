# 👾 PC Specs Evaluator

> A simple, friendly web app for evaluating **PC, Laptop, and Phone specifications**.

🌐 **Live Website:**  
**https://arwanddlearmw.github.io/my-friend-project-3**

---

## ✨ What is this?

**PC Specs Evaluator** is a small web project inspired by the original Android/Kotlin application.

It lets you enter your device specifications and get a quick evaluation in a clean and simple interface.

Whether you're checking a **PC 🖥️**, **Laptop 💻**, or **Phone 📱**, you can keep your builds saved and come back to them later.

---

## 🚀 Features

- 🖥️ PC specification evaluation
- 💻 Laptop specification evaluation
- 📱 Phone specification evaluation
- ⭐ Quick score and overall evaluation
- 💾 Save builds locally
- 📚 View saved builds
- 🗑️ Delete saved builds
- ✏️ Load and edit saved builds
- 🌍 Arabic / English interface
- ↔️ RTL / LTR support
- 📱 Responsive design for mobile and desktop
- ℹ️ About Us section
- 🤖 AI section ready for future integration

---

## 🛠️ Built With

- **HTML**
- **CSS**
- **JavaScript**
- **LocalStorage**

No framework is required.  
Just open `index.html` and it works. ✨

---

## 🤖 About AI

The current web version includes an AI section in the interface, but it does **not** expose a Gemini API key in the browser.

If Gemini is added later, the recommended architecture is:

```text
Website
   ↓
Backend API
   ↓
Gemini API
```

This keeps the API key private instead of placing it directly inside `script.js`.

---

## 📂 Project Structure

```text
pc_specs_evaluator/
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## 🌐 Try It

You can try the live version here:

👉 **https://arwanddlearmw.github.io/my-friend-project-3**

---

## 💙 About the Project

This project is a web adaptation of an Android application originally written with **Kotlin + Jetpack Compose**.

The goal is simple:

> **Enter your specs → get an evaluation → save your build → come back later.** 👾✨

---

## 📜 License

This project is released under the **GNU GPL** license.

Feel free to study it, modify it, and build upon it — just keep the project open under the terms of the license. 💙

---

Made with ☕ + 💻 + a little bit of 👾
