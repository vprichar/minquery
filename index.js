const fs = require('fs');
const request = require('google-oauth-jwt').requestWithJWT();
const BigQuery = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

const SCOPES = [
  'https://www.googleapis.com/auth/bigquery',
  'https://www.googleapis.com/auth/bigquery.insertdata',
];
class MinQueryError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class ResponseError extends MinQueryError {
  constructor(message, response) {
    super(message);
    this.response = response;
  }
}

class ProtocolError extends ResponseError {
}
class MinQuery {

  /**
   * Constructor.
   * @param  {string} options.key
   * @param  {string} options.keyFile 
   * @param  {string} options.email 
   * @param  {string} options.projectId 
   */
  constructor(options) {
    options = options || {};

    if (!options.key && !options.keyFile) {
      throw new Error('Debe especificar `options.key` ');
    } 
    if (!options.email) {
      throw new Error('Debe especificar `options.email` :(');
    }
    if (!options.projectId) {
      throw new Error('Debe especificar `options.projectId`');
    }

    if (options.keyFile) {
      this.key = fs.readFileSync(options.keyFile);
    } else {
      this.key = options.key;
    }

    if (options.keyFileJson) {
      this.keyFileJson = fs.readFileSync(options.keyFileJson);
    } else {
      this.keyFileJson = options.keyFileJson;
    }

    this.email = options.email;
    this.projectId = options.projectId;

    this.bigqueryClient = BigQuery({
      projectId: options.projectId,
      keyFilename: options.keyFileJson
    });
  }

  _request(method, path, data) {
    const url = `https://www.googleapis.com/bigquery/v2/projects/${this.projectId}${path}`;

    return new Promise((resolve, reject) => {
      request({
        method,
        body: data,
        json: true,
        url,
        jwt: {
          email: this.email,
          key: this.key,
          scopes: SCOPES,
        },
      }, (err, res) => {
        if (!err && res && res.body.error) {
          err = new ProtocolError(res.body.error.message || 'API response error', res);
        }

        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
  

  _requestDelete(method, path, data) {
    const url = `https://www.googleapis.com/bigquery/v2/projects/${this.projectId}${path}`;
    return new Promise((resolve, reject) => {
      request({
        method,
        json: true,
        url,
        jwt: {
          email: this.email,
          key: this.key,
          scopes: SCOPES,
        },
      }, (err, res) => {
        if (!err && res && res.body) {
          err = new ProtocolError(res.body.error.message || 'API response error', res);
        }

        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  /**
   * Create a table, returning the response on success.
   *
   * Ref: https://cloud.google.com/bigquery/docs/reference/v2/tables/insert
   * Ref: https://cloud.google.com/bigquery/docs/reference/v2/tables#resource
   *
   * @param  {string} dataset                  dataset name
   * @param  {string} tableName                table name
   * @param  {object[]} fields                 table schema
   * @param  {Date}   options.expirationDate   If set, a Date object specifying when
   *                                           the table should be expired.
   * @param  {object} options.timePartitioning If set, an object containing fields
   *                                           `expirationMs` and `type` which will be
   *                                           passed through to the BigQuery API.
   */
  createTable(dataset, tableName, fields, options) {
    options = options || {};

    const data = {
      schema: {
        fields,
      },
      tableReference: {
        projectId: this.projectId,
        datasetId: dataset,
        tableId: tableName,
      },
    };

    if (options.expirationDate) {
      data.expirationTime = options.expirationDate.getTime();
    }

    if (options.timePartitioning) {
      data.timePartitioning = options.timePartitioning;
    }

    return this._request('POST', `/datasets/${dataset}/tables`, data);
  }

  delete(dataset, tableName) {
   let  options = {};
    const data = {
      tableReference: {
        projectId: this.projectId,
        datasetId: dataset,
        tableId: tableName,
      },
    };
    return this._requestDelete('DELETE', `/datasets/${dataset}/tables/${tableName}`, data);
  }

  /**
   * Insert one or more rows, returning the response on success.
   *
   * Ref: https://cloud.google.com/bigquery/docs/reference/v2/tabledata/insertAll
   *
   * @param  {string}   dataset                     dataset name
   * @param  {string}   tableName                   table name
   * @param  {object[]} rows                        row data
   * @param  {boolean}  options.skipInvalidRows     Passed through to BigQuery API:
   *                                                Don't fail the whole request if a
   *                                                row is invalid (default true).
   * @param  {boolean}  options.ignoreUnknownValues Passed through to BigQuery API:
   *                                                Don't fail the whole request if a
   *                                                row is invalid (default true).
   * @param  {boolean}  options.addInsertId         Add a random insert id to each
   */
  insert(dataset, tableName, rows, options) {
    options = options || {};

    const rowData = rows.map((row) => {
      return { json: row };
    });

    const data = {
      kind: 'bigquery#tableDataInsertAllRequest',
      skipInvalidRows: options.skipInvalidRows !== undefined ?
        !!options.skipInvalidRows : true,
      ignoreUnknownValues: options.ignoreUnknownValues !== undefined ?
        !!options.ignoreUnknownValues : true,
      rows: rowData,
    };
    return this._request('POST', `/datasets/${dataset}/tables/${tableName}/insertAll`, data);

  }

  PATCH(dataset, tableName, rows, options) {
    options = options || {};

    const rowData = rows.map((row) => {
      return { json: row };
    });

    const data = {
      kind: 'bigquery#tableDataInsertAllRequest',
      skipInvalidRows: options.skipInvalidRows !== undefined ?
        !!options.skipInvalidRows : true,
      ignoreUnknownValues: options.ignoreUnknownValues !== undefined ?
        !!options.ignoreUnknownValues : true,
      rows: rowData,
    };
    return this._request('PATCH', `/datasets/${dataset}/tables/${tableName}`, data);
  }

  PUT(dataset, tableName, rows, options) {
    options = options || {};

    const rowData = rows.map((row) => {
      return { json: row };
    });

    const data = {
      kind: 'bigquery#tableDataInsertAllRequest',
      skipInvalidRows: options.skipInvalidRows !== undefined ?
        !!options.skipInvalidRows : true,
      ignoreUnknownValues: options.ignoreUnknownValues !== undefined ?
        !!options.ignoreUnknownValues : true,
      rows: rowData,
    };
    return this._request('PUT', `/datasets/${dataset}/tables/${tableName}`, data);
  }

  LIST(dataset, tableName, rows) {
    return this._request('GET', `/datasets/${dataset}/tables/${tableName}`);
  }

QUERY(query) {
    let ArrayData = []
    return new Promise((resolve, reject) => {
      bigquery.createQueryStream(query)
        .on('error', (row) => { reject(row) })
        .on('data', (row) => {
          ArrayData.push(row)
        }).on('end', () => {
          console.log(ArrayData, 'ArrayData')
          resolve(ArrayData);
        });
    });
  }

}

module.exports = MinQuery;