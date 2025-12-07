// /api/students.js

export default async function handler(req, res) {
  // ✅ Tumhara original sheet ID
  const SHEET_ID = "1Sc6V02qZZIZcbEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk";

  // ✅ G.S.D Student tab ka exact gid (tumne diya: 268742215)
  const GID = "268742215";

  // ✅ Direct CSV from correct tab
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    // Agar galti se HTML aa gaya (koi access issue) to empty bhej do
    const head = csvText.slice(0, 200).toLowerCase();
    if (head.includes("<html") || head.includes("<!doctype html")) {
      console.error("Got HTML instead of CSV:", head);
      return res.status(200).json([]);
    }

    if (!csvText || !csvText.includes(",")) {
      return res.status(200).json([]);
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length <= 1) {
      return res.status(200).json([]);
    }

    // first row = header, baaki data
    const rows = lines.slice(1).map((line) =>
      // CSV split (quotes handle karne ke liye)
      line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    );

    // Column order tumhare sheet ke hisaab se:
    // 0: Name
    // 1: Roll Number
    // 2: Branch (e.g. "CSE 3rd Sem")
    // 3: Email
    // 4: Phone
    const students = rows
      .map((colsRaw) => {
        const cols = colsRaw.map((c) => c.replace(/"/g, "").trim());

        const name = cols[0] || "";
        const roll = cols[1] || "";
        const branchCell = cols[2] || "";
        const email = cols[3] || "";
        const phone = cols[4] || "";

        let branch = "";
        const upper = branchCell.toUpperCase();
        if (upper.includes("CSE")) branch = "CSE";
        else if (upper.includes("BCA")) branch = "BCA";
        else branch = branchCell;

        return {
          name,
          roll,
          branch,
          sem: branchCell, // "CSE 3rd Sem" / "BCA 1st Sem"
          email,
          phone,
        };
      })
      .filter((s) => s.name && s.roll);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(students);
  } catch (err) {
    console.error("Sheet fetch error:", err);
    return res.status(500).json({ error: "Failed to load students" });
  }
}
