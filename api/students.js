// /api/students.js

export default async function handler(req, res) {
  const SHEET_PUB_ID =
    "2PACX-1vTaJg75EOky6LeoAtTHb_c6L7JE42tfUI-yB5ohx77yQTpUsVs9KNdSk-MToYipuPNj76gkzOqW2DUF";

  const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_PUB_ID}/pub?output=csv&gid=0`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    if (!csvText.trim().includes(",")) {
      return res.status(200).json([]);
    }

    const lines = csvText.trim().split(/\r?\n/);

    // ⬇️ Header ko ignore kar rahe hain
    const rows = lines.slice(1).map(line => line.split(","));

    // ✅ Tumhare exact column order ke hisaab se mapping:
    // 0 = Name
    // 1 = Roll Number
    // 2 = Branch  (example: "CSE 3rd Sem")
    // 3 = Email
    // 4 = Phone

    const students = rows.map(cols => ({
      name: cols[0]?.trim() || "",
      roll: cols[1]?.trim() || "",
      branch: cols[2]?.trim().includes("CSE") ? "CSE" : "BCA",
      sem: cols[2]?.trim() || "", // yahin se sem bhi nikal raha hai
      email: cols[3]?.trim() || "",
      phone: cols[4]?.trim() || ""
    }))
    .filter(s => s.name && s.roll);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(students);

  } catch (err) {
    console.error("Sheet Error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}
