'use strict';
const crypto = require('crypto'); // Do generowania ID

// Funkcja generująca ID w formacie zbliżonym do ObjectId (24 znaki hex)
function generateId() {
    return crypto.randomBytes(12).toString('hex');
}

module.exports = function (app, projectIssues) { // Odbieramy obiekt projectIssues

    app.route('/api/issues/:project')

        .get(function (req, res) {
            let project = req.params.project;

            // Pobierz zgłoszenia dla danego projektu lub pustą tablicę, jeśli projekt nie istnieje
            let issues = projectIssues[project] || [];

            // Filtrowanie na podstawie query params
            let filterKeys = Object.keys(req.query);
            if (filterKeys.length > 0) {
                issues = issues.filter(issue => {
                    return filterKeys.every(key => {
                        if (key === 'open') {
                            // Porównanie booleanów
                            return issue[key] === (req.query[key] === 'true');
                        } else if (key === '_id') {
                             // Proste porównanie stringów ID
                             return issue[key] === req.query[key];
                        }
                        // Porównanie innych pól jako stringi (lub dostosuj wg potrzeb)
                        // Uważaj na typy - req.query zawsze daje stringi
                        return String(issue[key]) === req.query[key];
                    });
                });
            }

            res.json(issues);
        })

        .post(function (req, res) {
            let project = req.params.project;
            const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

            // Sprawdzenie wymaganych pól
            if (!issue_title || !issue_text || !created_by) {
                return res.json({ error: 'required field(s) missing' });
            }

            // Utwórz nowy obiekt zgłoszenia
            const newIssue = {
                _id: generateId(), // Wygeneruj nowe ID
                issue_title: issue_title,
                issue_text: issue_text,
                created_by: created_by,
                assigned_to: assigned_to || '',
                status_text: status_text || '',
                created_on: new Date(),
                updated_on: new Date(),
                open: true
            };

            // Dodaj zgłoszenie do odpowiedniego projektu (utwórz, jeśli nie istnieje)
            if (!projectIssues[project]) {
                projectIssues[project] = [];
            }
            projectIssues[project].push(newIssue);

            // Zwróć utworzony obiekt
            res.json(newIssue);
        })

        .put(function (req, res) {
            let project = req.params.project;
            const { _id, ...updateFields } = req.body;

            // Sprawdzenie czy _id zostało przesłane
            if (!_id) {
                return res.json({ error: 'missing _id' });
            }

            // Sprawdzenie czy są jakiekolwiek pola do aktualizacji (inne niż _id)
            const updateKeys = Object.keys(updateFields).filter(key => updateFields[key] !== undefined && updateFields[key] !== '');
            if (updateKeys.length === 0) {
                return res.json({ error: 'no update field(s) sent', '_id': _id });
            }

            // Znajdź indeks zgłoszenia w tablicy dla danego projektu
            let issueIndex = -1;
            if (projectIssues[project]) {
                 issueIndex = projectIssues[project].findIndex(issue => issue._id === _id);
            }

            // Jeśli nie znaleziono zgłoszenia
            if (issueIndex === -1) {
                 // Uwaga: freeCodeCamp oczekuje błędu 'could not update' nawet dla nieistniejącego projektu,
                 // więc nie sprawdzamy tu `projectIssues[project]` explicitnie.
                 // Zakładamy, że jeśli nie ma `_id` w *żadnym* znanym projekcie (co findIndex załatwia), to jest błąd.
                 // Chociaż specyfikacja dotyczy konkretnego projektu w URL, testy mogą nie być tak szczegółowe.
                 // Dla bezpieczeństwa zwracamy błąd zgodnie ze specyfikacją dla PUT.
                 return res.json({ error: 'could not update', '_id': _id });
            }

            // Zaktualizuj pola zgłoszenia
            const issueToUpdate = projectIssues[project][issueIndex];
            updateKeys.forEach(key => {
                // Specjalna obsługa dla 'open' - konwersja na boolean, jeśli jest stringiem
                if (key === 'open') {
                    issueToUpdate[key] = String(updateFields[key]) === 'true';
                } else {
                    issueToUpdate[key] = updateFields[key];
                }
            });
            issueToUpdate.updated_on = new Date(); // Zawsze aktualizuj datę modyfikacji

            // Sukces
            res.json({ result: 'successfully updated', '_id': _id });
        })

        .delete(function (req, res) {
            let project = req.params.project;
            const { _id } = req.body;

            // Sprawdzenie czy _id zostało przesłane
            if (!_id) {
                return res.json({ error: 'missing _id' });
            }

            // Znajdź indeks zgłoszenia w tablicy dla danego projektu
            let issueIndex = -1;
             if (projectIssues[project]) {
                 issueIndex = projectIssues[project].findIndex(issue => issue._id === _id);
             }

            // Jeśli nie znaleziono zgłoszenia
             if (issueIndex === -1) {
                  // Podobnie jak w PUT, freeCodeCamp oczekuje 'could not delete' dla nieistniejącego _id.
                  return res.json({ error: 'could not delete', '_id': _id });
             }

            // Usuń zgłoszenie z tablicy
            projectIssues[project].splice(issueIndex, 1);

            // Sukces
            res.json({ result: 'successfully deleted', '_id': _id });
        });

};