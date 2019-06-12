const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

function DownloadColumns(response) {

    var columnNames = response["data"]["values"][0];
    var columnDataJson = {};

    for (i in columnNames) {
        columnDataJson[columnNames[i]] = alphabet[i];
    }

    return columnDataJson;
        
}

function DownloadData(response) {

    var fullData = response["data"]["values"];
    var columnNames = fullData[0];
    fullDataJson = {};

    for (var i = 1; i < fullData.length; i++) {
        var thisRow = {};
        thisRow["Row"] = parseInt(i, 10) + 1;
        for (j in columnNames) {
            thisRow[columnNames[j]] = fullData[i][j];
        }
        fullDataJson[thisRow["Player"]] = thisRow;
    }

    return fullDataJson;
}

function DownloadDiscordMap(response) {
    var discordMap = [];
    var fullData = response["data"]["values"];
    var columnNames = fullData[0];
    var userNameIndex = columnNames.indexOf('Player');
    var discordIDIndex = columnNames.indexOf('Discord ID');
    var accountTypeIndex = columnNames.indexOf('Account Type');
    
    for (var i = 1; i < fullData.length; i++)  {
        if (fullData[i][discordIDIndex] != undefined && fullData[i][accountTypeIndex] == "Main") {
            discordMap.push([fullData[i][discordIDIndex], fullData[i][userNameIndex]])
        }
    }

    return discordMap;
    
}

module.exports = {
    DownloadColumns,
    DownloadData,
    DownloadDiscordMap
};


