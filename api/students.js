// /api/students.js
export default async function handler(req, res) {
  const SHEET_ID = "1Sc6V02qZZIZcbEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk";
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    const lines = csvText.trim().split(/\r?\n/);
    if (!lines.length) {
      return res.status(200).json([]);
    }

    const header = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
    const lowerHeader = header.map(h => h.toLowerCase());

    const findIdx = (options) => {
      return lowerHeader.findIndex(h => options.includes(h));
    };

    const idxName   = findIdx(["name"]);
    const idxRoll   = findIdx(["roll number", "roll no", "roll"]);
    const idxBranch = findIdx(["branch"]);
    const idxSem    = findIdx(["sem", "semester"]);
    const idxEmail  = findIdx(["email"]);
    const idxPhone  = findIdx(["phone", "mobile"]);

    const students = rows.map(cols => ({
      name:   (cols[idxName]   || "").trim(),
      roll:   (cols[idxRoll]   || "").trim(),
      branch: (cols[idxBranch] || "").trim(),
      sem:    idxSem  >= 0 ? (cols[idxSem]  || "").trim() : "",
      email:  idxEmail>= 0 ? (cols[idxEmail]|| "").trim() : "",
      phone:  idxPhone>= 0 ? (cols[idxPhone]|| "").trim() : ""
    })).filter(s => s.name && s.roll);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(students);
  } catch (err) {
    console.error("Sheet fetch error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}
