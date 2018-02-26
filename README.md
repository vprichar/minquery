
This is a "minimal" client library for the BigQuery API. In contrast to the [official Google Cloud client library](https://github.com/GoogleCloudPlatform/google-cloud-node#google-bigquery), it does very little - and has very few dependencies.

**Supported:**

* Create a table.
* Delete a table.
* Insert row(s).
* PATCH row(s).
* PUT row(s).
* LIST row(s).
* QUERY reponde un [].


## Usage
```js
const MinQuery = require('minquery');
const client = new MinQuery({
  keyFile: 'some-file.pem',
  email: 'some-account@fake-project.iam.gserviceaccount.com',
  projectId: 'some-project'
});

// Create a table.
const schema = [
  {
    name: 'flavor',
    type: 'STRING',
    mode: 'REQUIRED',
    description: 'Ice cream flavor.'
  }
];

client.createTable('dataset', 'tablename', schema).then(() => {
  console.log('Yay, table created!');
}).catch(console.log);

// Insert some data.
const rows = [
  { flavor: 'mint' },
  { flavor: 'bubblegum' }
];

client.insert('dataset', 'tablename', rows).then((response) => {
  console.log(response.body);
}).catch(console.log);

##### delete
client.delete('dataset', 'tablename', schema).then(() => {
  console.log('Yay, table created!');
}).catch(console.log);

##### PATCH
client.PATCH('dataset', 'tablename', rows).then((response) => {
  console.log(response);
}).catch(console.log);

##### PUT
client.PUT('dataset', 'tablename', rows).then((response) => {
  console.log(response);
}).catch(console.log);

##### LIST
client.PUT('dataset', 'tablename', rows).then((response) => {
  console.log(response);
}).catch(console.log);

##### QUERY  
client.QUERY(QUERY).then((response) => {
  console.log(response);
}).catch(console.log);
