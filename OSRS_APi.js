var fetch = require('node-fetch');

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
    .then(res => {
        return res;
    });
}

module.exports = {
    Get_Total_Xp
}
