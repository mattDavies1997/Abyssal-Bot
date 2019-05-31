const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const spreadSheet = require("./googleSheets.js");
const startUp = require("./onStartUp.js");
const activity = require("./activity.js");

var columns;
var membersData;
var membersCount;
var nonMembersData;
var nonMembersCount;
var roleMap = new Map([
    ["ironmanbtw", "450852917293875221"],
    ["raiders", "464133699571548161"],
    ["bossers", "458293293944537109"]
]);

client.on('ready', () => {

    refreshData();
    
    client.on("message", async message => {
        if (message.author.bot) return;
        if (message.content.indexOf(config.prefix) !== 0) return;
        
        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        const fullArg = args.join(' ');

        // Mattaroo only commands!
        if (command === "activity") {
            if(!message.member.roles.some(r=>["Abyssal Bot"].includes(r.name)) )
                return message.reply("Sorry, you don't have permissions to use this!");

            // Obtain new total xp and provide xp to active members
            var userNames = [];

            for (userName in membersData) {
                userNames.push(userName)
            }

            activity.Get_Clan_TotalXp(userNames)
            .then(result => {
                var spreadsheetTotalXp = [];
                var spreadsheetXpChange = [];
                var spreadsheetAbyssalXp = [];
                var errorUserNames = [];
                
                for (i in result) {
                    var userName = result[i][0];
                    var totalXp = result[i][1];
                    
                    // Determining if user was active
                    if (totalXp == "Error") {
                        result[i].push(false);
                        errorUserNames.push(userName); 
                    } else {
                        prevTotalXp = membersData[userName]["Total Osrs Xp"];
                        if (prevTotalXp == "Error") {
                        result[i].push(true);
                        } else if (totalXp - prevTotalXp >= 10000) {
                        result[i].push(true);
                        } else {
                        result[i].push(false);
                        }
                    }

                    // Calculating how much xp the user should gain based off their activity
                    var active = result[i][2];
                    var xpGain = membersData[userName]["Activity"];
                    
                    if (active == true) {
                        xpGain = 100;
                    } else {
                        xpGain = Math.max(0, xpGain - 50);
                    }
                    
                    // Calculating user's new Abyssal Xp
                    var newAbyssalXp = Number(membersData[userName]["Abyssal Xp"]) + Number(xpGain);

                    // Putting membersData in format to be uploaded to spreadsheet and alter local membersData
                    spreadsheetTotalXp.push([totalXp]);
                    membersData[userName]["Total Osrs Xp"] = totalXp;

                    spreadsheetXpChange.push([xpGain]);
                    membersData[userName]["Activity"] = xpGain;

                    spreadsheetAbyssalXp.push([newAbyssalXp]);
                    membersData[userName]["Abyssal Xp"] = newAbyssalXp;
                }

                // Uploading new membersData to spreadsheet
                var totalXpCellRange = "Members!" + columns["Total Osrs Xp"] + "2:" + columns["Total Osrs Xp"] + (membersCount + 1).toString();
                var XpChangeCellRange = "Members!" + columns["Activity"] + "2:" + columns["Activity"] + (membersCount + 1).toString();
                var AbyssalXpCellRange = "Members!" + columns["Abyssal Xp"] + "2:" + columns["Abyssal Xp"] + (membersCount + 1).toString();

                spreadSheet.updateSpreadsheet(totalXpCellRange, spreadsheetTotalXp);
                spreadSheet.updateSpreadsheet(XpChangeCellRange, spreadsheetXpChange);
                spreadSheet.updateSpreadsheet(AbyssalXpCellRange, spreadsheetAbyssalXp);

                message.channel.send("Activity Check Completed!");

                message.channel.send("Here is the list of names that failed to be tracked, they likely changed their names:");
                for (name in errorUserNames) {
                    message.channel.send(errorUserNames[name]);
                }
            });
        }

        // Star only commands!
        if (command === "addattendance") {
            if(!message.member.roles.some(r=>["General", "Captain", "Lieutenant"].includes(r.name)) )
                return message.reply("Sorry, you don't have permissions to use this!");

            var userName = fullArg;

            if (userName == "") {
                message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.getattendance <USERNAME>`");
            } else if (membersData[userName] == null) {
                message.channel.send(userName + " is not a member!");
            } else {
                // Update it locally
                membersData[userName]["Attendance"] = (parseInt(membersData[userName]["Attendance"]) + 1).toString();

                // Update it on spreadsheet
                var userCell = "Members!" + columns["Attendance"] + membersData[userName]["Row"];
                spreadSheet.updateSpreadsheet(userCell, [[membersData[userName]["Attendance"]]]);

                message.channel.send("Attendance added to " + userName);
            }
        }

        if (command === "addmember") {
            if(!message.member.roles.some(r=>["General", "Captain", "Lieutenant"].includes(r.name)) )
                return message.reply("Sorry, you don't have permissions to use this!");
            
            userName = fullArg;

            // Checks that the member hasn't already been added to the spreadsheet
            if (userName == "") {
                message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.addmember <USERNAME>`");
            } else if (membersData[userName] != null) { // User is already a member
                message.channel.send(userName + " already in spreadsheet!");
            } else if (nonMembersData[userName] != null) { // User is already logged as a non-member
                message.channel.send(userName + " is in Non-Clan Members");
                if (nonMembersData[userName]["Rank Name"] == "Banned") { // User was banned!
                    message.channel.send(userName + " was banned!");
                } else { // User is a visitor or left the cc
                    var userData = nonMembersData[userName];

                    if (!(userData["Rank Name"] == "Recruit" ||
                    userData["Rank Name"] == "Corporal" ||
                    userData["Rank Name"] == "Sergeant")) {
                        userData["Rank Name"] == "Smiley";
                    }
                    if (userData["Date Joined"] == null) {
                        var now = new Date().toISOString()
                        var dateString = now.slice(5,7) + "/" + now.slice(8,10) + "/" + now.slice(0,4); 
                        userData["Data Joined"] = dateString;
                    }
                    if (userData["Abyssal Xp"] == null) {
                        userData["Abyssal Xp"] = 0;
                    }

                    
                    var rowNum = userData["Row"];
                    delete userData["Row"];
                    var userArray = [[]];
                    for (columnName in userData) {
                        userArray[0].push(userData[columnName]);
                    }
                    // Delete user's row in Non-Members
                    spreadSheet.deleteRow(663111242, rowNum);
                    // Append row to members sheet
                    spreadSheet.appendRow("Members", userArray);

                    refreshData();
                    client.channels.get("583036145710137354").send(userName);
                }
            } else { // Player is new to the clan
                var now = new Date().toISOString()
                var dateString = now.slice(5,7) + "/" + now.slice(8,10) + "/" + now.slice(0,4);
                var userArray = [
                    [
                        fullArg, // Username
                        "Smiley", // Rank Name
                        "Main", // Account Type
                        "", // Prev Username
                        0, // Attendance
                        dateString, // Date Joined
                        "", // Discord Tag
                        "", // Activity
                        "", // Abyssal Level
                        "", // Notes
                        "", // Time Zone
                        "", // Bosser
                        "", // Raiders
                        "", // IronmanBTW
                        "", // Abyssal Xp
                        "", // Total Osrs Xp
                        "" // Discord ID
                    ]
                ];
                
                // Append new user to members list
                spreadSheet.appendRow("Members", userArray);

                refreshData();
                message.channel.send(userName + " added to roster!");
                client.channels.get("583036145710137354").send(userName);
            }
        }

        if (command === "getinfo") {
            if(!message.member.roles.some(r=>["General", "Captain", "Lieutenant"].includes(r.name)) )
                return message.reply("Sorry, you don't have permissions to use this!");
            
            if (fullArg == "") {
                return message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.getinfo <USERNAME>`");
            }
            var userData = membersData[fullArg];

            if (userData == null) {
                message.channel.send(userName + " not a member!");
            } else {

                for (row in userData) {
                    if (userData[row] == "") {
                        userData[row] = "N/A";
                    }
                }
                var stringMessage =
                "_***Username:***_   " + userData["Player"] + "\n" +
                "_***Rank:***_   " + userData["Rank Name"] + "\n" +
                "_***Previous UserName:***_   " + userData["Prev Username"] + "\n" +
                "_***Attendance:***_   " + userData["Attendance"] + "\n" +
                "_***Date Joined:***_   " + userData["Date Joined"] + "\n" +
                "_***Discord Tag:***_   " + userData["Discord Tag"] + "\n" +
                "_***Activity:***_   " + "To be added!" + "\n" +
                "_***Abyssal Level:***_   " + "To be added!" + "\n" +
                "_***Notes:***_   " + userData["Notes"] + "\n" +
                "_***Time Zone:***_   " + userData["Time Zone"] + "\n" +
                "_***Bossers:***_   " + "To be added!" + "\n" +
                "_***Raiders:***_   " + "To be added!" + "\n" +
                "_***IronmanBTW:***_   " + "To be added!" + "\n"
                
                message.channel.send(stringMessage);
            }
        }

        // All members commands!
        if (command === "linkdiscord") {
            var userName = fullArg;

            if (userName == "") {
                message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.linkdiscord <USERNAME>`");
            } else if (membersData[userName] == null) {
                message.channel.send("Error, no one called " + userName + " on Database. Ping Mattaroo if you spelt it correctly!");
            } else {

                if (membersData[userName]["Discord ID"] == "") {
                    return message.channel.send("This username has already been linked. Please ping Mattaroo if this is your account and it wasn't you, so he can investigate!")
                }
                // Updating locally
                membersData[userName]["Discord Tag"] = message.member.user.tag;
                membersData[userName]["Discord ID"] = message.member.id;

                var tagCell = "Members!" + columns["Discord Tag"] + membersData[userName]["Row"];
                var idCell = "Members!" + columns["Discord ID"] + membersData[userName]["Row"];

                spreadSheet.updateSpreadsheet(tagCell, [[message.member.user.tag]]);
                spreadSheet.updateSpreadsheet(idCell, [[message.member.id]]);

                message.channel.send(userName + " linked to " + message.member.user.tag + "!");
            }
        }

        if (command === "addrole") {
            var role = fullArg;
            var roleLower = role.toLowerCase();

            if (role == "") {
                message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.addrole <ROLENAME>`");
            } else if (roleLower == "ironmanbtw" || roleLower == "raiders" || roleLower == "bossers") {
                message.member.addRole(roleMap.get(roleLower));
                message.channel.send(role + " added!")
            } else {
                message.channel.send("Cannot add " + role + ". Can only add 'IronmanBTW', 'Raiders' or 'Bossers' roles!")
            }
        }

        if (command === "removerole") {
            var role = fullArg;
            var roleLower = role.toLowerCase();

            if (role == "") {
                message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.removerole <ROLENAME>`");
            } else if (roleLower == "ironmanbtw" || roleLower == "raiders" || roleLower == "bossers") {
                message.member.removeRole(roleMap.get(roleLower));
                message.channel.send(role + " removed!")
            } else {
                message.channel.send("Cannot add " + role + ". Can only add 'IronmanBTW', 'Raiders' or 'Bossers' roles!")
            }
        }

        if(command === "ironman") {
            message.channel.send("BTW");
        }
      });
});

client.login(config.token);

function refreshData() {
    spreadSheet.readSpreadsheet("Members")
    .then(response => {
        columns = startUp.DownloadColumns(response);
        membersData = startUp.DownloadData(response);
        membersCount = Object.keys(membersData).length;
    });
    spreadSheet.readSpreadsheet("Non-Clan Members")
    .then(response => {
        nonMembersData = startUp.DownloadData(response);
        membersCount = Object.keys(nonMembersData).length;

        console.log("I'm Ready!");
    })
}