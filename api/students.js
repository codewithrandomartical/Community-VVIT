// /api/students.js

export default async function handler(req, res) {
  // 👉 Publish-to-web wala ID
  const SHEET_PUB_ID =
    "2PACX-1vTaJg75EOky6LeoAtTHb_c6L7JE42tfUI-yB5ohx77yQTpUsVs9KNdSk-MToYipuPNj76gkzOqW2DUF";

  // Agar data first sheet me hai to gid=0 (change karna ho to yahi pe karo)
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_PUB_ID}/pub?output=csv&gid=0`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    // Agar CSV hi nahi मिला (HTML aaya) to bhi empty bhej do
    if (!csvText.trim().includes(",")) {
      console.error("Not CSV, maybe publish settings issue.");
      res.status(200).json([]);
      return;
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (!lines.length) {
      res.status(200).json([]);
      return;
    }

    const headerRaw = lines[0].split(",");
    const rows = lines.slice(1).map((line) => line.split(","));

    const normalize = (str) =>
      str
        .toLowerCase()
        .replace(/["']/g, "")
        .replace(/[^a-z0-9]/g, "");

    const header = headerRaw.map((h) => h.trim());
    const normHeader = header.map((h) => normalize(h));

    const findIdx = (options) => {
      const normOptions = options.map((o) => normalize(o));
      return normHeader.findIndex((h) => normOptions.includes(h));
    };

    // Try: smart header detection
    let idxName = findIdx(["name", "student name"]);
    let idxRoll = findIdx(["roll", "roll no", "roll number"]);
    let idxBranch = findIdx(["branch", "course"]);
    let idxSem = findIdx(["sem", "semester"]);
    let idxEmail = findIdx(["email", "mail id"]);
    let idxPhone = findIdx(["phone", "mobile", "contact"]);

    // ⚠️ Fallback: agar header detect nahi hua to assume columns order:
    // 0: Name, 1: Roll, 2: Branch, 3: Sem, 4: Email, 5: Phone
    if (idxName === -1 || idxRoll === -1) {
      console.warn("Header detection failed, using fallback indexes.");
      idxName = 0;
      idxRoll = 1;
      idxBranch = 2;
      idxSem = 3;
      idxEmail = 4;
      idxPhone = 5;
    }

    const students = rows
      .map((colsRaw) => {
        const cols = colsRaw.map((c) => c.trim());
        const get = (idx) => (idx >= 0 && idx < cols.length ? cols[idx] : "");

        return {
          name: get(idxName),
          roll: get(idxRoll),
          branch: get(idxBranch),
          sem: get(idxSem),
          email: get(idxEmail),
          phone: get(idxPhone),
        };
      })
      .filter((s) => s.name && s.roll); // kam se kam name + roll hona chahiye

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(students);
  } catch (err) {
    console.error("Sheet fetch error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}
