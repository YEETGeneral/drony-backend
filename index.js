const express = require('express');
const os = require('os');
const { Pool } = require('pg');

const PORT = 3003;
const app = express();
app.use(express.json());


const host = os.platform() === 'win32' ? 'fedora' : 'postgres';
console.log(`Używany host bazy danych: ${host}`);

const pool = new Pool({
  user: 'user',
  host: host,
  database: 'drones',
  password: 'k4N!baLKut4$0w',
  port: 5432,
});

app.post('/add-location', async (req, res) => {
  const { latitude, longitude, azimuth, direction } = req.body;

  console.log(
    `Dodano drona: Lat: ${latitude}, Lon: ${longitude}, Azimuth: ${azimuth}, Direction: ${direction}`
  );

  if (
    latitude === undefined ||
    longitude === undefined ||
    azimuth === undefined ||
    direction === undefined
  ) {
    return res.status(400).json({ error: "Brak wymaganych pól." });
  }

  try {
    const query = `
      INSERT INTO drones_data (latitude, longitude, azimuth, direction)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [latitude, longitude, azimuth, direction];
    const result = await pool.query(query, values);

    res.json({
      message: "Dane zapisane!",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Błąd SQL:", err);
    res.status(500).json({ error: "Błąd zapisu do bazy." });
  }
});

app.get('/drones-data', async (req, res) => {
  try {
    const query = `SELECT * FROM drones_data;`;
    const result = await pool.query(query);

    res.json({
      message: "Dane pobrane pomyślnie!",
      data: result.rows,
    });

  } catch (err) {
    console.error("Błąd SQL:", err);
    res.status(500).json({ error: "Błąd zapisu do bazy." });
  }
})

app.get("/drones-map", async (req, res) => {
  const query = `SELECT * FROM drones_data;`;
  const drones_data = await pool.query(query);

  res.send(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Drony na mapie</title>

      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <style>
        body, html { margin: 0; padding: 0; height: 100%; }
        #map { height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

      <script>
        const drones = ${JSON.stringify(drones_data.rows)};
        console.log(drones);

        const map = L.map("map").setView([52.20, 21.00], 11);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        drones.forEach(drone => {
  const lat = parseFloat(drone.latitude);
  const lng = parseFloat(drone.longitude);
  const azimuth = parseFloat(drone.azimuth);
  const direction = parseFloat(drone.direction);

  // radiany dla azymutu (0° = północ, zgodnie z Leaflet)
  const rad = (azimuth * Math.PI) / 180;

  // długość azymutu (w stopniach — ok. 5 km przy 0.05)
  const length = 0.01;

  // punkt końcowy strzałki azymutu
  const endLat = lat + length * Math.cos(rad);
  const endLng = lng + length * Math.sin(rad);

  // marker drona
  L.circleMarker([lat, lng], { radius: 6 }).addTo(map);

  // strzałka azymutu
  L.polyline([[lat, lng], [endLat, endLng]], { weight: 3 }).addTo(map);

  // ---- STRZAŁKA DIRECTION ----

  // rzeczywisty kąt kierunku = azimuth + direction
  const totalAngle = (azimuth + direction) % 360;
  const rad2 = (totalAngle * Math.PI) / 180;

  // krótsza strzałka kierunku — np. 40% poprzedniej
  const length2 = length * 0.4;

  // punkt końcowy strzałki kierunku
  const dirEndLat = endLat + length2 * Math.cos(rad2);
  const dirEndLng = endLng + length2 * Math.sin(rad2);

  // rysowanie strzałki kierunku
  L.polyline([[endLat, endLng], [dirEndLat, dirEndLng]], {
    weight: 3,
    color: "red" // opcjonalnie, żeby odróżnić
  }).addTo(map);
});
      </script>
    </body>
    </html>
  `);
});


app.get('/', (req, res) => {
  res.send('Serwer działa!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on ${PORT}`)
})
