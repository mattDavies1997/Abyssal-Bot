const fetch = require('node-fetch');
const fs = require('fs');
const Promise = require('bluebird');
const spreadSheet = require("./spreadSheet.js");

async function Get_Total_Xp(userName) {
  var url = 'https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=' + userName;

  var headers = {
      "Content-Type": "application/json"
  }

  var options = {
      'method': 'get',
      'headers': headers
  }

  return await fetch(url, options)
  .then(res => res.text())
  .then(text => {

    if(text.includes("404 - Page not found")) {
      return "Error";
    }
    arr = text.split("\n");
    hiscores = [];

    for (i in arr) {
        hiscores.push(arr[i].split(","));
    }

    return hiscores[0][2];
  })
  .catch(() => {
    return "Error";
  });
}

async function Get_Clan_TotalXp(userNames) {
  return await Promise.all(
    userNames.map(
      async userName => 
      [userName, await Get_Total_Xp(userName)]));
}

module.exports = {
  Get_Clan_TotalXp
}

