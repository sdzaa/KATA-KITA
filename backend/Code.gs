function doPost(e) {
  try {
    initializeSpreadsheet();
  } catch (initError) {
    console.error("Initialization failed: " + initError.toString());
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var body = JSON.parse(e.postData.contents);
  var action = body.action;

  // Helper functions
  var getNextId = function(sheet) {
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return 1;
    var lastRow = data[data.length - 1];
    var lastId = parseInt(lastRow[0]);
    return isNaN(lastId) ? 1 : lastId + 1;
  };

  var getCurrentDate = function() {
    var d = new Date();
    return d.toISOString();
  };

  try {
    if (action == 'signup') {
      var sheet = ss.getSheetByName('user');
      var username = body.username;
      var password = body.password;
      
      var data = sheet.getDataRange().getValues();
      for(var i=1; i<data.length; i++) {
          if(data[i][1] == username) {
              return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Username already exists" }))
              .setMimeType(ContentService.MimeType.JSON);
          }
      }

      var newId = getNextId(sheet);
      var profile_picture = "avatar1";
      var display_name = username;
      var language = "id";
      var mode = "light"; // changed to match localstorage
      var notification = 1; 
      var skor = 0;

      sheet.appendRow([newId, username, password, profile_picture, display_name, language, mode, notification, skor]);
      return ContentService.createTextOutput(JSON.stringify({ "result": "success", "id": newId }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    if (action == 'login') {
      var sheet = ss.getSheetByName('user');
      var username = body.username;
      var password = body.password;

      var data = sheet.getDataRange().getValues();
      for(var i=1; i<data.length; i++) {
          if(data[i][1] == username && data[i][2] == password) {
              return ContentService.createTextOutput(JSON.stringify({ 
                  "result": "success", 
                  "user": {
                      "id": data[i][0],
                      "username": data[i][1],
                      "avatar": data[i][3],
                      "display_name": data[i][4],
                      "language": data[i][5],
                      "theme": data[i][6],
                      "notification": data[i][7],
                      "points": data[i][8]
                  }
              })).setMimeType(ContentService.MimeType.JSON);
          }
      }
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Invalid username or password" }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action == 'update_settings') {
      var sheet = ss.getSheetByName('user');
      var username = body.username;
      
      var data = sheet.getDataRange().getValues();
      var found = false;
      for(var i=1; i<data.length; i++) {
          if(data[i][1] == username) {
              // Update Avatar (col D / 4)
              if (body.avatar) sheet.getRange(i+1, 4).setValue(body.avatar);
              // Update Display Name (col E / 5)
              if (body.display_name) sheet.getRange(i+1, 5).setValue(body.display_name);
              // Update Language (col F / 6)
              if (body.language) sheet.getRange(i+1, 6).setValue(body.language);
              // Update Theme (col G / 7)
              if (body.theme) sheet.getRange(i+1, 7).setValue(body.theme);
              // Update Notification (col H / 8)
              if (body.notification !== undefined) sheet.getRange(i+1, 8).setValue(body.notification);
              found = true;
              break;
          }
      }
      if(!found) throw new Error("User not found");
      return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action == 'insert') {
      var tableName = body.tableName;
      var sheet = ss.getSheetByName(tableName);
      if(!sheet) throw new Error("Table not found: " + tableName);
      
      var newId = getNextId(sheet);
      var date = getCurrentDate();
      
      var rowData = [];
      if (tableName == 'diary') {
          rowData = [newId, body.username, body.diary, date];
      } else if (tableName == 'mood_tracker') {
          rowData = [newId, body.username, body.mood, date];
      } else if (tableName == 'gratitude_wall') {
          rowData = [newId, body.message, date];
      } else if (tableName == 'saved_items') {
          rowData = [newId, body.username, body.items, date];
      } else if (tableName == 'kindness_feeds_comments') {
          rowData = [newId, body.story_id, body.comment, date];
      } else if (tableName == 'kindness_feeds') {
          rowData = [newId, body.username, body.story, 0]; // 0 hugs initially
      } else if (tableName == 'tasks') {
          rowData = [newId, body.task, body.skor, date];
      } else {
          throw new Error("Table not supported for generic insert.");
      }
      
      sheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({ "result": "success", "id": newId }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    if (action == 'update_skor') {
        var sheet = ss.getSheetByName('user');
        var username = body.username;
        var pointsToAdd = parseInt(body.points);
        
        var data = sheet.getDataRange().getValues();
        var found = false;
        for(var i=1; i<data.length; i++) {
            if(data[i][1] == username) {
                var currentSkor = parseInt(data[i][8]) || 0;
                sheet.getRange(i+1, 9).setValue(currentSkor + pointsToAdd);
                found = true;
                break;
            }
        }
        if(!found) throw new Error("User not found");
        return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action == 'add_hug') {
        var sheet = ss.getSheetByName('kindness_feeds');
        var storyId = parseInt(body.story_id);
        
        var data = sheet.getDataRange().getValues();
        var found = false;
        for(var i=1; i<data.length; i++) {
            if(parseInt(data[i][0]) == storyId) {
                var currentHugs = parseInt(data[i][3]) || 0;
                sheet.getRange(i+1, 4).setValue(currentHugs + 1);
                found = true;
                break;
            }
        }
        if(!found) throw new Error("Story not found");
        return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action == 'get_data') {
        var tables = body.tables;
        var responseData = {};
        for(var t = 0; t < tables.length; t++) {
            var tableName = tables[t];
            var sheet = ss.getSheetByName(tableName);
            if (sheet) {
                var values = sheet.getDataRange().getValues();
                if (values.length <= 1) {
                    responseData[tableName] = [];
                    continue;
                }
                var headers = values[0];
                var rows = [];
                for (var i = 1; i < values.length; i++) {
                    var row = {};
                    for (var j = 0; j < headers.length; j++) {
                        row[headers[j]] = values[i][j];
                    }
                    rows.push(row);
                }
                responseData[tableName] = rows;
            } else {
                responseData[tableName] = [];
            }
        }
        return ContentService.createTextOutput(JSON.stringify({ "result": "success", "data": responseData }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": e.toString() }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
    try {
        initializeSpreadsheet();
        return ContentService.createTextOutput("Backend is running. Spreadsheet has been successfully initialized/verified. Please use POST to submit data.");
    } catch(err) {
        return ContentService.createTextOutput("Backend is running, but spreadsheet initialization failed: " + err.toString());
    }
}

/**
 * Initializes the spreadsheet by creating missing sheets and their header columns.
 * Can be run manually from the Apps Script editor or triggered automatically on request.
 */
function initializeSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var expectedSheets = {
    'user': ["id", "username", "password", "profile_picture", "display_name", "language", "mode", "notification", "skor"],
    'diary': ["id", "username", "diary", "date"],
    'mood_tracker': ["id", "username", "mood", "date"],
    'gratitude_wall': ["id", "message", "date"],
    'saved_items': ["id", "username", "items", "date"],
    'kindness_feeds_comments': ["id", "story_id", "comment", "date"],
    'kindness_feeds': ["id", "username", "story", "hugs"],
    'tasks': ["id", "task", "skor", "date"],
    'education': ["id", "tag", "title", "summary", "link", "image_class", "date"],
    'comfort_messages': ["id", "message"],
    'heartfelt_voices': ["id", "title", "narrator"]
  };

  for (var sheetName in expectedSheets) {
    var sheet = ss.getSheetByName(sheetName);
    var headers = expectedSheets[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    } else {
      var lastColumn = sheet.getLastColumn();
      if (lastColumn === 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
        sheet.setFrozenRows(1);
      } else {
        var existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
        var isHeaderMatch = true;
        if (existingHeaders.length < headers.length) {
          isHeaderMatch = false;
        } else {
          for (var i = 0; i < headers.length; i++) {
            if (existingHeaders[i] !== headers[i]) {
              isHeaderMatch = false;
              break;
            }
          }
        }
        if (!isHeaderMatch) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
          sheet.setFrozenRows(1);
        }
      }
    }
  }

  // Delete default Sheet1 if empty and other sheets exist
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0 && defaultSheet.getLastColumn() === 0) {
    ss.deleteSheet(defaultSheet);
  }
}
