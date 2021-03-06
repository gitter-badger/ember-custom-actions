/* eslint ember-suave/no-direct-property-access:1 */

import Ember from 'ember';
import DS from 'ember-data';
import { moduleForModel, test } from 'ember-qunit';
import Pretender from 'pretender';

moduleForModel('post', 'Unit | Model | post', {
  needs: ['config:environment', 'serializer:application'],

  beforeEach() {
    this.server = new Pretender();
  },

  afterEach() {
    this.server.shutdown();
  }
});

test('model action', function(assert) {
  assert.expect(3);

  this.server.put('/posts/:id/publish', (request) => {
    let data = JSON.parse(request.requestBody);
    assert.deepEqual(data, { myParam: 'My first param' });
    assert.equal(request.url, '/posts/1/publish');

    return [200, { }, 'true'];
  });

  let done = assert.async();
  let payload = { myParam: 'My first param' };

  let model = this.subject();
  model.set('id', 1);

  model.publish(payload).then((response) => {
    assert.ok(response, true);
    done();
  });
});

test('model action pushes to store', function(assert) {
  assert.expect(5);

  this.server.put('/posts/:id/publish', (request) => {
    let data = JSON.parse(request.requestBody);
    assert.deepEqual(data, { myParam: 'My first param' });
    assert.equal(request.url, '/posts/1/publish');

    return [200, {}, '{"data": {"id": 2, "type": "Post"}}'];
  });

  let done = assert.async();
  let payload = { myParam: 'My first param' };
  let store = this.store();
  let model = this.subject();

  model.set('id', 1);
  assert.equal(store.peekAll('post').get('length'), 1);

  model.publish(payload).then((response) => {
    assert.equal(response.get('id'), 2);
    assert.equal(store.peekAll('post').get('length'), 2);
    done();
  });
});

test('resource action', function(assert) {
  assert.expect(3);

  this.server.put('/posts/list', (request) => {
    let data = JSON.parse(request.requestBody);
    assert.deepEqual(data, { myParam: 'My first param' });
    assert.equal(request.url, '/posts/list');

    return [200, { }, 'true'];
  });

  let done = assert.async();
  let payload = { myParam: 'My first param' };

  let model = this.subject();
  model.set('id', 1);

  model.list(payload).then((response) => {
    assert.ok(response, true);
    done();
  });
});

test('resource action with params in GET', function(assert) {
  assert.expect(3);

  this.server.get('/posts/search', (request) => {
    assert.equal(request.url, '/posts/search?my-param=My%20first%20param');
    assert.equal(request.requestHeaders.test, 'Custom header');
    return [200, { }, 'true'];
  });

  let done = assert.async();
  let payload = { myParam: 'My first param' };

  let model = this.subject();
  model.set('id', 1);
  model.search(payload, { ajaxOptions: { headers: { test: 'Custom header' } } }).then((response) => {
    assert.ok(response, true);
    done();
  });
});

test('resource action pushes to store', function(assert) {
  assert.expect(5);

  this.server.put('/posts/list', (request) => {
    let data = JSON.parse(request.requestBody);
    assert.deepEqual(data, { myParam: 'My first param' });
    assert.equal(request.url, '/posts/list');

    return [200, {}, '{"data": [{"id": "2", "type": "post"},{"id": "3", "type": "post"}]}'];
  });

  let done = assert.async();
  let payload = { myParam: 'My first param' };
  let store = this.store();
  let model = this.subject();

  model.set('id', 1);
  assert.equal(store.peekAll('post').get('length'), 1);

  model.list(payload).then((response) => {
    assert.equal(response.length, 2);
    assert.equal(store.peekAll('post').get('length'), 3);
    done();
  });
});

test('promiseTypes', function(assert) {
  assert.expect(6);

  this.server.put('/posts/list', (request) => {
    assert.equal(request.url, '/posts/list');

    return [200, {}, '{"data": [{"id": "2", "type": "post"},{"id": "3", "type": "post"}]}'];
  });

  let model = this.subject();

  let promise = model.list();
  let promiseArray = model.list(null, { promiseType: 'array' });
  let promiseObject = model.list(null, { promiseType: 'object' });

  assert.equal(promise.constructor, Ember.RSVP.Promise);
  assert.equal(promiseArray.constructor, DS.PromiseArray);
  assert.equal(promiseObject.constructor, DS.PromiseObject);
});
