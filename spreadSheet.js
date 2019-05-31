const {google} = require('googleapis');
var sheets = google.sheets('v4');
fs = require('fs');
const config = require('./config.json');
const credentials = require('./credentials.json');
const token = require('./token.json');

var spreadSheetID = config.spreadSheetID;
var sheetMap = new Map(config.sheetMap);

// Update
async function updateSpreadsheet(cellRange, cellValues) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  
  var request = {
    spreadsheetId: spreadSheetID,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    resource: {
        "values": cellValues
    },
    auth: oAuth2Client,
  };

  var response = sheets.spreadsheets.values.update(request);
  return await response;
};

// Read
async function readSpreadsheet(cellRange) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  var request = {
    spreadsheetId: spreadSheetID,
    range: cellRange,
    auth: oAuth2Client,
  };

  var response = sheets.spreadsheets.values.get(request);
  return await response;
};

// Delete row
async function deleteRow(sheet, row) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  
  var request = {
    auth: oAuth2Client,
    spreadsheetId: spreadSheetID,
    resource: {
      "requests": 
      [
        {
          "deleteRange": 
          {
            "range": 
            {
              "sheetId": sheetMap.get(sheet),
              "startRowIndex": row - 1,
              "endRowIndex": row
            },
            "shiftDimension": "ROWS"
          }
        }
      ]
    }
  }
  var response = sheets.spreadsheets.batchUpdate(request);
  return await response;
};

// Append Row
async function appendRow(sheet, rowValues) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  
  var request = {
    spreadsheetId: spreadSheetID,
    range: sheet,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
        "values": rowValues
    },
    auth: oAuth2Client,
  };

  var response = sheets.spreadsheets.values.append(request);
  return await response;
};

module.exports = {
  updateSpreadsheet,
  readSpreadsheet,
  deleteRow,
  appendRow
};
