// /api/students.js
export default async function handler(req, res) {
  // tumhara sheet ID
  const SHEET_ID = "1Sc6V02qZZIZcbEZVgd3RJbYVxeNXJ7tocjfzS1BtYQk";
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    // Agar sheet private hai to yahan HTML aayega, CSV nahi
    // is case me hum detect karke empty list bhej denge
    if (!csvText.trim().includes(",")) {
      console.error("Seems not a CSV (maybe sheet is private?)");
      res.status(200).json([]);
      return;
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (!lines.length) {
      return res.status(200).json([]);
    }

    // CSV header + rows
    const headerRaw = lines[0].split(",");
    const rows = lines.slice(1).map((line) => line.split(","));

    // header normalize: lowercase + sab punctuation hatao
    const normalize = (str) =>
      str
        .toLowerCase()
        .replace(/["']/g, "")
        .replace(/[^a-z0-9]/g, ""); // sirf a-z0-9

    const header = headerRaw.map((h) => h.trim());
    const normHeader = header.map((h) => normalize(h));

    const findIdx = (options) => {
      const normOptions = options.map((o) => normalize(o));
      return normHeader.findIndex((h) => normOptions.includes(h));
    };

    // yahan tum sheet ke columns ka naam chahe kuch bhi rakho,
    // jab tak unme ye words hain, ye mil jaayenge
    const idxName = findIdx(["name", "student name"]);
    const idxRoll = findIdx(["roll", "roll no", "roll number"]);
    const idxBranch = findIdx(["branch", "course"]);
    const idxSem = findIdx(["sem", "semester"]);
    const idxEmail = findIdx(["email", "mail id"]);
    const idxPhone = findIdx(["phone", "mobile", "contact"]);

    // agar name ya roll hi nahi mila to direct empty
    if (idxName === -1 || idxRoll === -1) {
      console.error("Name/Roll columns not detected in sheet header:", header);
      res.status(200).json([]);
      return;
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
      // kam se kam name + roll hona chahiye
      .filter((s) => s.name && s.roll);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(students);
  } catch (err) {
    console.error("Sheet fetch error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}
