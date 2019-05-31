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
    fullData.shift();
    fullDataJson = {};

    for (i in fullData) {
        var thisRow = {};
        thisRow["Row"] = parseInt(i, 10) + 2;
        for (j in columnNames) {
            thisRow[columnNames[j]] = fullData[i][j];
        }
        fullDataJson[thisRow["Player"]] = thisRow;
    }

    return fullDataJson;
}

module.exports = {
    DownloadColumns,
    DownloadData
};


