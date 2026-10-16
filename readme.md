# 🧹 JSON Cleaner & Formatter — Super Recover

✨ **Transform messy JSON into clean, structured beauty!** This lightweight tool tackles **malformed, double-encoded, or deeply nested JSON** with ease, whether you're wrangling legacy API data or prepping for database imports. Available as a **Node.js CLI** for batch processing and a **web app** for interactive cleaning.

🌐 **Try it live**: [ttech-json-formatter.netlify.app](https://ttech-json-formatter.netlify.app/)

---

## 🎯 Why JSON Cleaner?

JSON Cleaner & Formatter is your go-to solution for taming chaotic JSON. It handles:

- **Double-encoded strings** (`"{\"key\": \"value\"}"`)
- **Stray slashes** (`\/`), trailing commas, and unquoted keys
- **Nested stringified JSON** (e.g., `data.updated.updated` or `invoice.attachment`)
- **Broken or inconsistent formatting**

Whether you're a developer, data engineer, or QA analyst, this tool saves time and headaches with **fault-tolerant parsing** and **pretty-printed output**.

---

## 📁 Project Structure

```
json-cleaner/
├── rawdata.txt         # 🔍 Input file for messy JSON (Node.js CLI)
├── cleanJson.json      # ✅ Cleaned and formatted JSON output
├── index.html          # 🌐 Web interface for interactive cleaning
├── style.css           # 🎨 Styles for the web app
├── script.js           # 🧠 JavaScript logic for the web app
├── main.js             # 🚀 Node.js script for CLI cleaning
└── README.md           # 📖 You're here!
```

---

## ⚙️ How It Works

### Node.js CLI

1. **Reads**: Loads raw JSON from `rawdata.txt`.
2. **Cleans**:
    - Parses stringified fields like `data.updated.updated` (arrays) and `invoice.attachment` (objects).
    - Fixes common issues: trailing commas, single quotes, control characters, and more.
3. **Outputs**: Writes pretty-printed JSON to `cleanJson.json`.

### Web App

1. **Input**: Paste messy JSON into the browser interface.
2. **Process**: Cleans and formats with real-time diagnostics.
3. **Output**: Displays readable JSON with options to copy or download.

### 🔐 Fault Tolerance

- Skips unparseable fields with warnings (e.g., `⚠️ Could not parse attachment for invoice: INV-12345`).
- Logs detailed diagnostics to console and web UI.
- Handles up to **5MB** of input with robust error recovery.

---

## 🚀 Quick Start

### Option 1: Web App

1. Visit [ttech-json-formatter.netlify.app](https://ttech-json-formatter.netlify.app/).
2. Paste your messy JSON in the input textarea.
3. Click **Clean & Format**, **Beautify**, or **Minify**.
4. Copy or download the cleaned JSON. 🎉

### Option 2: Node.js CLI

1. **Clone the repo**:
   ```bash
   git clone https://github.com/yourusername/json-cleaner.git
   cd json-cleaner
   ```
2. **Add your JSON**: Place raw JSON in `rawdata.txt`.
3. **Run the script** (requires **Node.js v12+**):
   ```bash
   node main.js
   ```
4. **Check output**:
   ```
   ✅ Clean JSON written to cleanJson.json
   ```

---

## 🌟 Features

- **Dual Modes**: Interactive web app and lightweight CLI.
- **Robust Parsing**:
    - Attempts raw `JSON.parse` first.
    - Removes control characters and stray bytes.
    - Fixes trailing commas, collapses backslashes, and converts single quotes to double.
    - Quotes unquoted keys conservatively.
    - Extracts JSON-like substrings from noisy input.
    - Recursively parses nested stringified JSON.
- **User-Friendly Web UI**:
    - Real-time loader and diagnostics.
    - Interactive buttons with hover effects and toast notifications.
    - Copy/download cleaned JSON with one click.
- **Lightweight**: CLI uses only native Node.js `fs` and `path`. Web app uses minimal dependencies (jQuery, Toastr, Tailwind CSS).
- **Pretty Output**: Consistent indentation for readability.

---

## 🧪 Use Cases

- **API Cleanup**: Normalize double-encoded JSON from legacy systems.
- **Database Prep**: Standardize data for smooth imports.
- **Debugging**: Validate and format JSON for automation or manual QA.
- **Prototyping**: Quickly test and clean JSON during development.

---

## 🛠️ Requirements

- **Node.js CLI**: Node.js v12+ (no external libraries).
- **Web App**:
    - Modern browser (Chrome, Firefox, Safari, etc.).
    - CDN dependencies: jQuery, Toastr, Tailwind CSS.

---

## 📸 Screenshots

| Web App Interface                                                       | CLI Output                                                  |
|-------------------------------------------------------------------------|-------------------------------------------------------------|
| ![Web App](https://via.placeholder.com/600x300?text=Web+App+Screenshot) | ![CLI](https://via.placeholder.com/600x300?text=CLI+Output) |

*Note*: Replace placeholder images with actual screenshots for a polished look!

---

## 📄 License

[MIT License](LICENSE) — Free to use, modify, and share.

---

## 🤝 Contributing

We 💖 contributions! To get started:

1. Fork the repo.
2. Create a branch (`git checkout -b feature/cool-idea`).
3. Commit your changes (`git commit -m "Add cool feature"`).
4. Push to the branch (`git push origin feature/cool-idea`).
5. Open a pull request!

Found a bug? Have a feature idea? Open an [issue](https://github.com/yourusername/json-cleaner/issues)!

---

## 👤 Author

**Your Name**  
[GitHub](https://github.com/traximuser6) | [LinkedIn](https://linkedin.com/in/yourname)

---

## 🏷️ Badges

![Node.js](https://img.shields.io/badge/Node.js-v12+-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Deployed](https://img.shields.io/badge/Deployed-Netlify-blueviolet)

---

## 🎉 Get Involved!

- ⭐ Star the repo to show your support!
- Try the [live demo](https://ttech-json-formatter.netlify.app/) and share feedback.
- Join the open-source community by contributing code, docs, or ideas.

---

### Notes

- **Modernized**: Added a cool, developer-friendly tone with emojis for emphasis without clutter.
- **Web + CLI**: Clearly documents both the web app and Node.js CLI, integrating the `<DOCUMENT>` details (e.g., repair steps, 5MB limit, example JSON).
- **Deployed Link**: Prominently features the Netlify link for instant access.
- **Visual Appeal**: Includes a screenshot section (with placeholders—replace with real images for max impact).
- **Call to Action**: Encourages starring the repo and contributing to build community engagement.
- **Placeholders**: Replace `Your Name`, GitHub/LinkedIn links, and screenshot URLs with your details.

Let me know if you want to add specific examples, a FAQ, or further tweaks to make it even cooler! 😎



