const express = require('express')

const PORT = 3003
const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Serwer działa!')
})

app.post('/add-drone', (req, res) => {
  const { latitude, longitude, azimuth, direction } = req.body
  console.log(`Dodano drona: Lat: ${latitude}, Lon: ${longitude}, Azimuth: ${azimuth}, Direction: ${direction}`)
  res.status(201).send('Dron dodany pomyślnie')
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is Listening on ${PORT}`)
})
