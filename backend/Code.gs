function createJSONResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function fetchArticleMetadata(url) {
  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, timeout: 10000 });
    var html = response.getContentText();
    
    var title = '';
    var summary = '';
    var image = '';
    
    // Extract Open Graph title
    var ogTitle = html.match(/<meta[^>]*property=[\"']og:title[\"'][^>]*content=[\"']([^\"']*)[\"']/i);
    if (ogTitle) title = ogTitle[1];
    
    // Fallback to page title
    if (!title) {
      var pageTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (pageTitle) title = pageTitle[1];
    }
    
    // Extract Open Graph description
    var ogDesc = html.match(/<meta[^>]*property=[\"']og:description[\"'][^>]*content=[\"']([^\"']*)[\"']/i);
    if (ogDesc) summary = ogDesc[1];
    
    // Fallback to meta description
    if (!summary) {
      var metaDesc = html.match(/<meta[^>]*name=[\"']description[\"'][^>]*content=[\"']([^\"']*)[\"']/i);
      if (metaDesc) summary = metaDesc[1];
    }
    
    // Extract Open Graph image
    var ogImage = html.match(/<meta[^>]*property=[\"']og:image[\"'][^>]*content=[\"']([^\"']*)[\"']/i);
    if (ogImage) image = ogImage[1];
    // Fallback: first <img src=> on the page
    if (!image) {
      var imgTag = html.match(/<img[^>]*src=[\"']([^\"']+)[\"']/i);
      if (imgTag) image = imgTag[1];
    }

    // Normalize relative URLs to absolute using the page origin
    if (image) {
      try {
        // If protocol-relative (//example.com/..), add https:
        if (/^\/\//.test(image)) {
          image = 'https:' + image;
        } else if (!/^https?:\/\//i.test(image)) {
          // relative path -> prepend origin from url
          var originMatch = url.match(/^(https?:\/\/[^\/]+)/i);
          var origin = originMatch ? originMatch[1] : '';
          if (image.charAt(0) === '/') {
            image = origin + image;
          } else {
            image = origin + '/' + image;
          }
        }
      } catch (e) {
        // ignore normalization errors
      }
    }
    
    return {
      title: title || 'Untitled',
      summary: summary || 'No description available',
      image_url: image || ''
    };
  } catch (e) {
    return {
      title: 'Error loading article',
      summary: 'Could not fetch article content',
      image_url: ''
    };
  }
}

function doPost(e) {
  try {
    initializeSpreadsheet();
  } catch (initError) {
    console.error("Initialization failed: " + initError.toString());
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJSONResponse({ result: 'error', message: 'Invalid JSON body' });
  }
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
      if (!sheet) throw new Error('User sheet not found');
      var username = body.username;
      var password = body.password;
      var display_name = body.display_name || '';
      
      var data = sheet.getDataRange().getValues();
      for(var i=1; i<data.length; i++) {
          if(data[i][1] == username) {
              return createJSONResponse({ result: 'error', message: 'Username already exists' });
          }
      }

      var newId = getNextId(sheet);
      var profile_picture = 'avatar1';
      var language = 'id';
      var mode = 'light';
      var notification = 1; 
      var skor = 0;

      sheet.appendRow([newId, username, password, profile_picture, display_name, language, mode, notification, skor]);
      return createJSONResponse({ result: 'success', id: newId });
    }

    if (action == 'login') {
      var sheet = ss.getSheetByName('user');
      if (!sheet) throw new Error('User sheet not found');
      var username = body.username;
      var password = body.password;

      var data = sheet.getDataRange().getValues();
      for(var i=1; i<data.length; i++) {
          if(data[i][1] == username && data[i][2] == password) {
              return createJSONResponse({ 
                  result: 'success', 
                  user: {
                      id: data[i][0],
                      username: data[i][1],
                      avatar: data[i][3],
                      display_name: data[i][4],
                      language: data[i][5],
                      theme: data[i][6],
                      notification: data[i][7],
                      points: data[i][8]
                  }
              });
          }
      }
      return createJSONResponse({ result: 'error', message: 'Invalid username or password' });
    }
    
    if (action == 'update_settings') {
      var sheet = ss.getSheetByName('user');
      if (!sheet) throw new Error('User sheet not found');
      var username = body.username;
      
      var data = sheet.getDataRange().getValues();
      var found = false;
      for(var i=1; i<data.length; i++) {
          if(data[i][1] == username) {
              if (body.avatar) sheet.getRange(i+1, 4).setValue(body.avatar);
              if (body.display_name) sheet.getRange(i+1, 5).setValue(body.display_name);
              if (body.language) sheet.getRange(i+1, 6).setValue(body.language);
              if (body.theme) sheet.getRange(i+1, 7).setValue(body.theme);
              if (body.notification !== undefined) sheet.getRange(i+1, 8).setValue(body.notification);
              found = true;
              break;
          }
      }
      if(!found) throw new Error('User not found');
      return createJSONResponse({ result: 'success' });
    }
    
    if (action == 'insert') {
        var tableName = body.tableName;
        var sheet = ss.getSheetByName(tableName);
        if(!sheet) throw new Error('Table not found: ' + tableName);

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
          var commentUsername = body.username || '';
          var commentDisplayName = body.display_name || '';
          rowData = [newId, body.story_id, commentUsername, commentDisplayName, body.comment, date];
        } else if (tableName == 'kindness_feeds') {
            rowData = [newId, body.username, body.story, 0];
        } else if (tableName == 'tasks') {
            rowData = [newId, body.task, body.skor, date];
        } else if (tableName == 'education') {
            rowData = [newId, body.url, body.title, body.summary, body.image_url];
        } else {
            throw new Error('Table not supported for generic insert.');
        }

        sheet.appendRow(rowData);
        return createJSONResponse({ result: 'success', id: newId });
    }

    if (action == 'update_skor') {
        var sheet = ss.getSheetByName('user');
        var username = body.username;
        var pointsToAdd = parseInt(body.points) || 0;
        
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
        if(!found) throw new Error('User not found');
        return createJSONResponse({ result: 'success' });
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
        if(!found) throw new Error('Story not found');
        return createJSONResponse({ result: 'success' });
    }
    
    if (action == 'fetch_article_metadata') {
        var url = body.url;
        var articleId = body.article_id;
        
        if (!url) {
            return createJSONResponse({ result: 'error', message: 'URL is required' });
        }
        
        var metadata = fetchArticleMetadata(url);
        
        if (articleId) {
            var sheet = ss.getSheetByName('education');
            var data = sheet.getDataRange().getValues();
            for(var i=1; i<data.length; i++) {
                if(parseInt(data[i][0]) == articleId) {
                    sheet.getRange(i+1, 3).setValue(metadata.title);
                    sheet.getRange(i+1, 4).setValue(metadata.summary);
                    sheet.getRange(i+1, 5).setValue(metadata.image_url);
                    break;
                }
            }
        }
        
        return createJSONResponse({ result: 'success', data: metadata });
    }
    
    if (action == 'get_data') {
        var tables = body.tables || [];
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
        return createJSONResponse({ result: 'success', data: responseData });
    }
    
    return createJSONResponse({ result: 'error', message: 'Invalid action' });

  } catch(e) {
    return createJSONResponse({ result: 'error', message: e.toString() });
  }
}

function doGet(e) {
    try {
        initializeSpreadsheet();
        return createJSONResponse({ result: 'success', message: 'Backend is running. Spreadsheet has been successfully initialized/verified. Please use POST to submit data.' });
    } catch(err) {
        return createJSONResponse({ result: 'error', message: 'Backend is running, but spreadsheet initialization failed: ' + err.toString() });
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
    'kindness_feeds_comments': ["id", "story_id", "username", "display_name", "comment", "date"],
    'kindness_feeds': ["id", "username", "story", "hugs"],
    'tasks': ["id", "task", "skor", "date"],
    'education': ["id", "url", "title", "summary", "image_url"],
    'comfort_messages': ["id", "message", "mood"],
    'heartfelt_voices': ["id", "title", "narrator", "url", "mood"]
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
  // Seed default education articles if empty
  var eduSheet = ss.getSheetByName('education');
  if (eduSheet) {
    var lastRow = eduSheet.getLastRow();
    if (lastRow <= 1) {
      var urls = [
        'https://www.sciencenews.org/article/artemis-ii-moon-finale',
        'https://www.sciencenews.org/article/primitive-star-galaxy-early-universe',
        'https://www.sciencenews.org/article/polar-structure-galaxies-stars-disks',
        'https://www.sciencenews.org/article/every-living-creature-organ-transplant'
      ];
      for (var i = 0; i < urls.length; i++) {
        var id = i + 1;
        eduSheet.appendRow([id, urls[i], '', '', '']);
      }
    }
  }
  // Seed default Kindness Feed posts if empty
  var kfSheet = ss.getSheetByName('kindness_feeds');
  if (kfSheet) {
    var kfLastRow = kfSheet.getLastRow();
    if (kfLastRow <= 1) {
      // Sample posts
      var samplePosts = [
        [1, 'Sunflower', 'Welcome to the Kindness Feed! Share your thoughts.', 0],
        [2, 'Sunflower', 'Remember to stay positive and spread love.', 0],
        [3, 'Sunflower', 'What made you smile today? Let us know!', 0]
      ];
      for (var i = 0; i < samplePosts.length; i++) {
        kfSheet.appendRow(samplePosts[i]);
      }
    }
  }
}
