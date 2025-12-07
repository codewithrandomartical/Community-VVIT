export default async function handler(req, res) {
  // ✅ Tumhara ORIGINAL Sheet ID (edit wali link se)
  const SHEET_ID = "1Sc6V02qZZIZcbEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk";

  // ✅ First sheet auto-fetch (no gid needed)
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    if (!csvText || !csvText.includes(",")) {
      return res.status(200).json([]);
    }

    const lines = csvText.trim().split(/\r?\n/);

    // ✅ Header remove
    const rows = lines.slice(1).map(line =>
      line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    );

    const students = rows
      .map(cols => ({
        name: cols[0]?.replace(/"/g, "").trim(),
        roll: cols[1]?.replace(/"/g, "").trim(),
        branch: cols[2]?.includes("CSE") ? "CSE" : "BCA",
        sem: cols[2]?.replace(/"/g, "").trim(),
        email: cols[3]?.replace(/"/g, "").trim(),
        phone: cols[4]?.replace(/"/g, "").trim()
      }))
      .filter(s => s.name && s.roll);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: "Sheet fetch failed" });
  }
}
