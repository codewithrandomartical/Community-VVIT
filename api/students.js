// /api/students.js

export default async function handler(req, res) {
  // 👇 tumhara main sheet ID (address bar se)
  // https://docs.google.com/spreadsheets/d/1Sc6V0Q2ZZtZcBEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk/edit
  const SHEET_ID = "1Sc6V0Q2ZZtZcBEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk";
  const GID = "0"; // first sheet = G.S.D Student

  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

  try {
    const response = await fetch(SHEET_URL);
    const text = await response.text();

    // 🔎 Agar HTML aa raha (sheet public nahi hai) to error return karo
    const head = text.slice(0, 200).toLowerCase();
    if (head.includes("<!doctype html") || head.includes("<html")) {
      return res.status(500).json({
        error:
          "Google Sheet is not public. Set sharing to 'Anyone with the link – Viewer'.",
      });
    }

    // CSV parse
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length <= 1) {
      return res.status(200).json([]);
    }

    // first row = header, baaki = data
    const rows = lines.slice(1).map((line) => line.split(","));

    // Tumhara exact order:
    // 0: Name
    // 1: Roll Number
    // 2: Branch (e.g. "CSE 3rd Sem")
    // 3: Email
    // 4: Phone
    const students = rows
      .map((colsRaw) => {
        const cols = colsRaw.map((c) => c.trim());
        const name = cols[0] || "";
        const roll = cols[1] || "";
        const branchCell = cols[2] || "";
        const email = cols[3] || "";
        const phone = cols[4] || "";

        let branch = "";
        const upperBranch = branchCell.toUpperCase();
        if (upperBranch.includes("CSE")) branch = "CSE";
        else if (upperBranch.includes("BCA")) branch = "BCA";
        else branch = branchCell;

        return {
          name,
          roll,
          branch,
          sem: branchCell, // "CSE 3rd Sem" / "BCA 1st Sem" poora yahi
          email,
          phone,
        };
      })
      .filter((s) => s.name && s.roll); // kam se kam name + roll hona chahiye

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(students);
  } catch (err) {
    console.error("Sheet fetch error:", err);
    return res.status(500).json({ error: "Failed to load students" });
  }
}
