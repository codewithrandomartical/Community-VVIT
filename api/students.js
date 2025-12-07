// /api/students.js

export default async function handler(req, res) {
  // 👉 original share link se document ID
  // https://docs.google.com/spreadsheets/d/1Sc6V02qZZIZcbEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk/edit?usp=sharing
  const SHEET_ID = "1Sc6V02qZZIZcbEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk";

  // 👉 yahan sheet tab ka exact naam likho (bottom me jo green tab dikhta hai)
  // tumhare PDF se lag raha "G.S.D Student" hoga, agar alag hai to bas yahi change kar dena
  const SHEET_NAME = "G.S.D Student";

  // Google gviz CSV endpoint
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    SHEET_NAME
  )}`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    // agar kuch bhi text nahi aaya
    if (!csvText || !csvText.trim()) {
      res.status(200).json([]);
      return;
    }

    // simple CSV parsing (emails me comma nahi hai to safe hai)
    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length <= 1) {
      res.status(200).json([]);
      return;
    }

    // first row = header, baaki = data
    const rows = lines.slice(1).map((line) => line.split(","));

    // 📌 Tumhara exact column order:
    // 0: Name
    // 1: Roll Number
    // 2: Branch (e.g. "CSE 3rd Sem")
    // 3: Email
    // 4: Phone
    const students = rows.map((colsRaw) => {
      const cols = colsRaw.map((c) => c.trim());

      const branchCell = cols[2] || "";
      let branch = branchCell;
      if (branchCell.toUpperCase().includes("CSE")) branch = "CSE";
      else if (branchCell.toUpperCase().includes("BCA")) branch = "BCA";

      return {
        name: cols[0] || "",
        roll: cols[1] || "",
        branch,
        sem: branchCell, // full "CSE 3rd Sem" yahi daal diya
        email: cols[3] || "",
        phone: cols[4] || "",
      };
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(students);
  } catch (err) {
    console.error("Sheet Error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}
