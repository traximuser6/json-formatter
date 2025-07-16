
# 🧹 JSON Cleaner


A lightweight Node.js tool to **parse, clean, and normalize messy JSON** — especially helpful when dealing with **stringified or deeply nested JSON** from legacy systems or third-party APIs.

---

## 📁 Project Structure

```

json-cleaner/
├── rawdata.txt        # 🔸 Raw input with messy JSON
├── cleanJson.json     # ✅ Cleaned output (auto-generated)
└── main.js            # 🧠 Script with core logic

```

---

## ⚙️ How It Works

1. **Reads** raw JSON from `rawdata.txt`
2. **Parses & cleans**:
   - `data.updated.updated` — may be a **stringified JSON array**
   - Each `invoice.attachment` — possibly **stringified JSON objects**
3. **Safely transforms** these fields into real JSON structures
4. **Outputs** a clean, pretty-formatted JSON file → `cleanJson.json`

### 🔐 Fault Tolerant

If a field like `attachment` fails to parse, the script logs a warning and keeps going:

```

⚠️ Could not parse attachment for invoice: INV-12345

````

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/json-cleaner.git
cd json-cleaner
````

### 2. Add Your Raw JSON

Drop your raw/messy JSON into a file named:

```
rawdata.txt
```

### 3. Run the Cleaner

Make sure Node.js is installed, then run:

```bash
node main.js
```

If successful, you'll see:

```
✅ Clean JSON written to cleanJson.json
```

---

## ✅ Requirements

* **Node.js v12+**
* No external libraries — uses native `fs` and `path` modules only

---

## 🧪 Example Use Cases

* Cleaning **double-encoded JSON** from outdated APIs
* Normalizing **inconsistent data** before importing into a database
* Quickly validating and formatting malformed JSON for automation or manual QA

---

## 📄 License

Licensed under the [MIT License](LICENSE)

---

## 🤝 Contributions

Got ideas or improvements? Open an issue or submit a pull request — contributions are warmly welcome!

---

## 👤 Author

**Your Name**
[GitHub](https://github.com/traximuser6) • [LinkedIn](https://linkedin.com/in/yourname)



---

### ✅ Notes:
- I cleaned up repetition, reduced emoji clutter, and added visual hierarchy for easy reading.
- You can replace `"Your Name"` and links with real content.
- Want a badge section (e.g., `node version`, license)? I can add that too.





