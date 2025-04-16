const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');


chai.use(chaiHttp);

suite('Functional Tests', function () {
  let testId;
  let project = 'test-project';

  test('Create an issue with every field', function (done) {
    chai
      .request(server)
      .post('/api/issues/' + project)
      .send({
        issue_title: 'Title',
        issue_text: 'Text',
        created_by: 'Functional Test - Every field',
        assigned_to: 'Chai and Mocha',
        status_text: 'In QA',
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Title');
        assert.equal(res.body.issue_text, 'Text');
        assert.equal(res.body.created_by, 'Functional Test - Every field');
        assert.equal(res.body.assigned_to, 'Chai and Mocha');
        assert.equal(res.body.status_text, 'In QA');
        assert.exists(res.body._id);
        assert.exists(res.body.created_on);
        assert.exists(res.body.updated_on);
        assert.equal(res.body.open, true);
        testId = res.body._id;
        done();
      });
  });

  test('Create an issue with only required fields', function (done) {
    chai
      .request(server)
      .post('/api/issues/' + project)
      .send({
        issue_title: 'Title',
        issue_text: 'Text',
        created_by: 'Functional Test - Required fields only',
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Title');
        assert.equal(res.body.issue_text, 'Text');
        assert.equal(res.body.created_by, 'Functional Test - Required fields only');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        done();
      });
  });

  test('Create an issue with missing required fields', function (done) {
    chai
      .request(server)
      .post('/api/issues/' + project)
      .send({ issue_title: 'Title' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
  });

  test('View issues on a project', function (done) {
    chai
      .request(server)
      .get('/api/issues/' + project)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  test('View issues on a project with one filter', function (done) {
    chai
      .request(server)
      .get('/api/issues/' + project + '?open=true')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  test('View issues on a project with multiple filters', function (done) {
    chai
      .request(server)
      .get('/api/issues/' + project + '?open=true&assigned_to=Chai and Mocha')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  test('Update one field on an issue', function (done) {
    chai
      .request(server)
      .put('/api/issues/' + project)
      .send({ _id: testId, issue_text: 'Updated text' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
        done();
      });
  });

  test('Update multiple fields on an issue', function (done) {
    chai
      .request(server)
      .put('/api/issues/' + project)
      .send({
        _id: testId,
        issue_text: 'Updated again',
        assigned_to: 'Updated person',
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: testId });
        done();
      });
  });

  test('Update an issue with missing _id', function (done) {
    chai
      .request(server)
      .put('/api/issues/' + project)
      .send({ issue_text: 'Missing id' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

  test('Update an issue with no fields to update', function (done) {
    chai
      .request(server)
      .put('/api/issues/' + project)
      .send({ _id: testId })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: testId });
        done();
      });
  });

  test('Update an issue with an invalid _id', function (done) {
    chai
      .request(server)
      .put('/api/issues/' + project)
      .send({ _id: 'invalidid123456', issue_text: 'Invalid id test' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not update', _id: 'invalidid123456' });
        done();
      });
  });

  test('Delete an issue', function (done) {
    chai
      .request(server)
      .delete('/api/issues/' + project)
      .send({ _id: testId })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully deleted', _id: testId });
        done();
      });
  });

  test('Delete an issue with an invalid _id', function (done) {
    chai
      .request(server)
      .delete('/api/issues/' + project)
      .send({ _id: 'invalidid123456' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not delete', _id: 'invalidid123456' });
        done();
      });
  });

  test('Delete an issue with missing _id', function (done) {
    chai
      .request(server)
      .delete('/api/issues/' + project)
      .send({})
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });
});
