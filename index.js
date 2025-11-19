const express = require('express');
const os = require('os');
const { Pool } = require('pg');

const PORT = 3003;
const app = express();
app.use(express.json());


const host = os.platform() === 'win32' ? 'fedora' : 'localhost';
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

app.get('/', (req, res) => {
  res.send('Serwer działa!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on ${PORT}`)
})
