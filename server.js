'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai').expect;
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// --- Ładowanie danych z zewnętrznego API ---
const projectIssues = {}; // Obiekt do przechowywania zgłoszeń per projekt
const defaultProjectName = 'sample_project'; // Nazwa projektu dla danych z API
const initialDataUrl = 'https://issue-tracker.freecodecamp.rocks/api/issues/apitest/';

async function loadInitialData() {
  try {
    const response = await fetch(initialDataUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const initialIssues = await response.json();
    projectIssues[defaultProjectName] = initialIssues;
    console.log(`Loaded ${initialIssues.length} issues into project '${defaultProjectName}' from API.`);
  } catch (err) {
    console.error("Error fetching or parsing initial issues from API:", err);
    // Jeśli wystąpił błąd, inicjalizujemy pustą tablicę dla projektu
    projectIssues[defaultProjectName] = [];
  }
}

// Wywołanie funkcji ładowania danych
loadInitialData();

// ---------------------------------------------------------

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); // For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sample front-end
app.route('/:project/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/issue.html');
  });

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// For FCC testing purposes
fccTestingRoutes(app);

// Routing for API - przekazujemy obiekt z danymi
apiRoutes(app, projectIssues);

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  // Uwaga: NODE_ENV=test jest nadal potrzebny dla testów freeCodeCamp
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    // Dajemy trochę czasu na start serwera przed testami
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500); // Krótszy timeout, bo nie czekamy na DB
  }
});

module.exports = app; // for testing
