```markdown
# 🧹 JSON Cleaner

A simple Node.js script to read, parse, and clean deeply nested or stringified JSON data structures—especially useful when dealing with malformed or inconsistently formatted JSON from third-party sources.

---

## 📂 Project Structure

```

.
├── rawdata.txt        # Raw JSON file (input)
├── cleanJson.json     # Cleaned JSON output (auto-generated)
└── main.js            # Core logic to parse and clean the data

````

---

## 🚀 How It Works

1. **Reads** a raw JSON file (`rawdata.txt`)
2. **Parses** the file, specifically checking for:
   - A nested key `data.updated.updated` which may be a stringified JSON array
   - Each `invoice.attachment` field, which may also be stringified JSON
3. **Safely parses** those stringified JSON fields
4. **Outputs** a clean, well-formatted JSON file to `cleanJson.json`

---

## 🛠️ Usage

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/json-cleaner.git
cd json-cleaner
````

### 2. Add Your Raw JSON

Place your raw JSON content inside a file named `rawdata.txt` in the root of the project.

### 3. Run the Script

Make sure you have Node.js installed, then run:

```bash
node main.js
```

If all goes well, you'll see:

```
✅ Clean JSON written to cleanJson.json
```

If any individual JSON field fails to parse (like `attachment`), the script will log a warning and continue:

```
⚠️ Could not parse attachment for invoice: INV-12345
```

---

## ✅ Requirements

* Node.js (v12+ recommended)
* No external dependencies (pure `fs` and `path` modules)

---

## 📌 Example Use Case

This is particularly useful if:

* You're consuming legacy or third-party APIs that double-encode JSON fields
* You need to clean inconsistent structures before further processing or importing into databases
* You want a quick tool to validate and normalize malformed JSON for manual review or automation

---

## 📄 License

MIT License

---

## 🙌 Contributions

Pull requests and suggestions are welcome. Feel free to fork this repo and adapt it to your needs!

---

## ✨ Author

**Your Name**
[GitHub](https://github.com/yourusername) | [LinkedIn](https://linkedin.com/in/yourname)
