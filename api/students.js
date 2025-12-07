// /api/students.js
export default async function handler(req, res) {
  // 👉 yahan publish-to-web wala "d/e/...." ID use kar rahe hain
  const SHEET_PUB_ID =
    "2PACX-1vTaJg75EOky6LeoAtTHb_c6L7JE42tfUI-yB5ohx77yQTpUsVs9KNdSk-MToYipuPNj76gkzOqW2DUF";

  // agar tumhara data first sheet me hai to gid=0 theek hai
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_PUB_ID}/pub?output=csv&gid=0`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    // basic check: agar CSV nahi mila (HTML aaya) to empty
    if (!csvText.trim().includes(",")) {
      console.error("Not CSV (maybe publish settings issue?)");
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
        .replace(/[^a-z0-9]/g, ""); // sirf a-z0-9

    const header = headerRaw.map((h) => h.trim());
    const normHeader = header.map((h) => normalize(h));

    const findIdx = (options) => {
      const normOptions = options.map((o) => normalize(o));
      return normHeader.findIndex((h) => normOptions.includes(h));
    };

    const idxName = findIdx(["name", "student name"]);
    const idxRoll = findIdx(["roll", "roll no", "roll number"]);
    const idxBranch = findIdx(["branch", "course"]);
    const idxSem = findIdx(["sem", "semester"]);
    const idxEmail = findIdx(["email", "mail id"]);
    const idxPhone = findIdx(["phone", "mobile", "contact"]);

    if (idxName === -1 || idxRoll === -1) {
      console.error("Name/Roll columns not detected in header:", header);
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
      .filter((s) => s.name && s.roll); // kam se kam name + roll

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(students);
  } catch (err) {
    console.error("Sheet fetch error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
}
