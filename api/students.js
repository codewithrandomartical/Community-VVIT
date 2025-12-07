export default async function handler(req, res) {
  const SHEET_PUB_ID =
    "2PACX-1vTaJg75EOky6LeoAtTHb_c6L7JE42tfUI-yB5ohx77yQTpUsVs9KNdSk-MToYipuPNj76gkzOqW2DUF";

  // ✅ IMPORTANT: G.S.D Student tab ka GID
  const GID = "0"; // agar ye 0 par kaam na kare to main next step me exact gid nikalwa dunga

  const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_PUB_ID}/pub?output=csv&gid=${GID}`;

  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();

    if (!csvText || !csvText.includes(",")) {
      return res.status(200).json([]);
    }

    const lines = csvText.trim().split(/\r?\n/);
    const rows = lines.slice(1).map(line => {
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    });

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
    res.status(500).json({ error: "Failed to fetch students" });
  }
}
