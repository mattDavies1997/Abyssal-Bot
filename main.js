const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const spreadSheet = require("./spreadSheet.js");
const startUp = require("./onStartUp.js");
const activity = require("./activity.js");

var columns;
var membersData;
var membersCount;
var nonMembersData;
var discordMap;
var nonMembersCount;
var roleMap = new Map(config.rolesMap);

client.on('ready', () => {

    refreshData();
    console.log("I'm Ready!");
    
    client.on("message", async message => {
        if (message.author.bot) return;
        if (message.content.indexOf(config.botPrefix) !== 0) return;
        
        const args = message.content.slice(config.botPrefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        const fullArg = args.join(' ');

        // Mattaroo only commands!
        if (command === "activity") {
            if(!config.Owner.includes(message.member.id))
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

                refreshData();
                message.channel.send("Here is the list of names that failed to be tracked, they likely changed their names:");
                for (name in errorUserNames) {
                    message.channel.send(errorUserNames[name]);
                }
            });
        }

        if (command === "refresh") {
            if(!config.Owner.includes(message.member.id))
                return message.reply("Sorry, you don't have permissions to use this!");
            refreshData();
            message.channel.send("Data Refreshed!");
        }
        
        if (command === "restart") {
            if(!config.Owner.includes(message.member.id))
                return message.reply("Sorry, you don't have permissions to use this!");
            message.channel.send('Resetting..')
            .then(() => resetBot());
        }
        // Admin only commands!
        if (command === "changerank") {
            if(!message.member.roles.some(r=>config.Admin.includes(r.name))) {
                return message.reply("Sorry, you don't have permissions to use this!");
            }

            var argsArray = fullArg.split(", ");

            if (argsArray.length != 2) {    
                return message.channel.send("Command should be of the form:" + "\n"
                + "`.changerank <USERNAME>, <RANK>`");
            }

            var userName = argsArray[0];        
            var userData = membersData[userName];   
            var newRank = argsArray[1];
                   
            if (userData == null) {    
                return message.channel.send(userName + " does not exist in our system!")   
            }
            
            var oldRank = userData["Rank Name"];

            var newRankCell = "Members!" + columns["Rank Name"] + userData["Row"];
            
            spreadSheet.updateSpreadsheet(newRankCell, [[newRank]]);

            refreshData();
            message.channel.send(userName + "'s rank has been changed from " + oldRank + " to " + newRank + "!");
        }

        // Mod only commands!
        if (command === "addattendance") {
            if(!message.member.roles.some(r=>config.Mod.includes(r.name)))
                return message.reply("Sorry, you don't have permissions to use this!");

            var userName = fullArg;
            var userData = membersData[userName];
            if (userName == "") {
                return message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.getattendance <USERNAME>`");
            }
            if (userData == null) {
                return message.channel.send(userName + " is not a member!");
            }

            var newAttendance = (parseInt(userData["Attendance"]) + 1).toString();

            // Update it on spreadsheet
            var userCell = "Members!" + columns["Attendance"] + userData["Row"];
            spreadSheet.updateSpreadsheet(userCell, [[newAttendance]]);

            refreshData();
            message.channel.send("Attendance added to " + userName);
        }

        if (command === "addmember") {
            if(!message.member.roles.some(r=>config.Mod.includes(r.name)))
                return message.reply("Sorry, you don't have permissions to use this!");
            
            userName = fullArg;

            // Checks that the member hasn't already been added to the spreadsheet
            if (userName == "") {
                return message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.addmember <USERNAME>`");
            }
            if (membersData[userName] != null) { // User is already a member
                return message.channel.send(userName + " already in spreadsheet!");
            } 
            
            if (nonMembersData[userName] != null) { // User is already logged as a non-member
                if (nonMembersData[userName]["Rank Name"] == "Banned") { // User was banned!
                    message.channel.send(userName + " was **banned**!");
                } else { // User is a visitor or left the cc
                    var userData = nonMembersData[userName];

                    if (!(userData["Rank Name"] == "Recruit" ||
                    userData["Rank Name"] == "Corporal" ||
                    userData["Rank Name"] == "Sergeant")) {
                        userData["Rank Name"] = "Smiley";
                    }
                    if (userData["Date Joined"] == null) {
                        var now = new Date().toISOString()
                        var dateString = now.slice(5,7) + "/" + now.slice(8,10) + "/" + now.slice(0,4); 
                        userData["Date Joined"] = dateString;
                    }
                    if (userData["Attendance"] == null) {
                        userData["Attendance"] = 0;
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
                    spreadSheet.deleteRow("Non-Clan Members", rowNum);
                    // Append row to members sheet
                    spreadSheet.appendRow("Members", userArray);

                    refreshData();
                    message.channel.send(userName + " was in Non-Clan Members!" + "\n" +
                    "They have been moved back to members with rank " + userData["Rank Name"]);
                    client.channels.get("583036145710137354").send(userName +  "\n" + "**Rank:** " + userData["Rank Name"]);
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
                        "", // Abyssal Xp
                        "", // Total Osrs Xp
                        "" // Discord ID
                    ]
                ];
                
                // Append new user to members list
                spreadSheet.appendRow("Members", userArray);

                refreshData();
                message.channel.send(userName + " added to roster!");
                client.channels.get("583036145710137354").send(userName + "\n" + "**Rank:** Smiley");
            }
        }

        // All members commands!
        if (command === "linkdiscord") {
            var userName = fullArg;

            if (userName == "") {
                return message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.linkdiscord <USERNAME>`");
            }
            if (membersData[userName] == null) {
                return message.channel.send("Error, no one called " + userName + " on Database. Ping Mattaroo if you spelt it correctly!");
            }

            if (membersData[userName]["Discord ID"] != undefined) {
                return message.channel.send("This username has already been linked!")
            }

            var tagCell = "Members!" + columns["Discord Tag"] + membersData[userName]["Row"];
            var idCell = "Members!" + columns["Discord ID"] + membersData[userName]["Row"];

            spreadSheet.updateSpreadsheet(tagCell, [[message.member.user.tag]]);
            spreadSheet.updateSpreadsheet(idCell, [[message.member.id]]);

            refreshData();
            message.channel.send(userName + " linked to " + message.member.user.tag + "!");
        }
        
        if (command === "addrole") {
            var role = fullArg;
            var roleLower = role.toLowerCase();

            if (role == "") {
                return message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.addrole <ROLENAME>`");
            }
            
            if (roleMap.get(roleLower) != undefined) {
                message.member.addRole(roleMap.get(roleLower));
                message.channel.send(role + " added!");
            } else {
                message.channel.send("Cannot add " + role + ". Please refer to #clan-information to see what roles you can add!");
            }
        }

        if (command === "removerole") {
            var role = fullArg;
            var roleLower = role.toLowerCase();

            if (role == "") {
                message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + "`.removerole <ROLENAME>`");
            } else if (roleMap.get(roleLower) != undefined) {
                message.member.removeRole(roleMap.get(roleLower));
                message.channel.send(role + " removed!");
            } else {
                message.channel.send("Cannot remove " + role + ". Please refer to #clan-information to see what roles you can remove!");
            }
        }

        if (command === "info") {
            var userName = fullArg;
            var userData = membersData[userName];

            if (fullArg == "") {
                return message.channel.send("Please enter a Username! Command should be of the form:" + "\n"
                + ".info <USERNAME>");
            }
            
            if (userData == null) {
                return message.channel.send(userName + " does not exist in our system!");
            }
            
            if(!message.member.roles.some(r=>config.Mod.includes(r.name))) {
                if (userData["Discord ID"] != message.member.id) {
                    return message.channel.send(userName + " is not linked to your Discord!" + "\n"
                    + "You do not have permissions to see this account's info!")
                }
            }
            
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
            "_***Abyssal Level:***_   " + "To be added!" + "\n" +
            "_***Time Zone:***_   " + userData["Time Zone"] + "\n"
            
            message.channel.send(stringMessage);
            
        }

        if (command == "changename") {
            var userNameArgs = fullArg.split(", ");

            if (userNameArgs.length != 2) {
                return message.channel.send("Command should be of the form:" + "\n"
                + ".changename <OLD_USERNAME>, <NEW_USERNAME>");
            }
            
            var oldUserName = userNameArgs[0];
            var userData = membersData[oldUserName];
            var newUserName = userNameArgs[1];
            
            if (userData == null) {
                return message.channel.send(oldUserName + " does not exist in our system!")
            }
            
            if(!message.member.roles.some(r=>config.Admin.includes(r.name))) {
                if (userData["Discord ID"] != message.member.id) {
                    return message.channel.send(oldUserName + " is not linked to your Discord!" + "\n"
                    + "You do not have permissions to change this Username!")
                } 
            }
            
            var oldUserNameCell = "Members!" + columns["Prev Username"] + userData["Row"];
            var newUserNameCell = "Members!" + columns["Player"] + userData["Row"];
            
            spreadSheet.updateSpreadsheet(oldUserNameCell, [[oldUserName]]);
            spreadSheet.updateSpreadsheet(newUserNameCell, [[newUserName]]);
            
            refreshData();
            message.channel.send(oldUserName + " has been updated to " + newUserName + "!");
            
        }

        if (command === "changetimezone") {
            var argsArray = fullArg.split(", ");

            if (argsArray.length != 2) {    
                return message.channel.send("Command should be of the form:" + "\n"
                + ".changetimezone <USERNAME>, <TIMEZONE>");
            }

            var userName = argsArray[0];        
            var userData = membersData[userName];   
            var timeZone = argsArray[1];
                   
            if (userData == null) {    
                return message.channel.send(userName + " does not exist in our system!")   
            }    
            if(!message.member.roles.some(r=>config.Admin.includes(r.name))) {        
                if (userData["Discord ID"] != message.member.id) {         
                    return message.channel.send(userName + " is not linked to your Discord!" + "\n"
                    + "You do not have permissions to change this Username!")
                }
            }
            
            var timeZoneCell = "Members!" + columns["Time Zone"] + userData["Row"];
            
            spreadSheet.updateSpreadsheet(timeZoneCell, [[timeZone]]);

            refreshData();
            
            message.channel.send(userName + "'s Time Zone has been updated to " + timeZone + "!");
            
        }

        if (command === "ironman") {
            message.channel.send("BTW");
        }
    });
});

client.on("error", (e) => {
    console.error(e);
    resetBot();
});
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));

client.login(config.botToken);

function refreshData() {
    spreadSheet.readSpreadsheet("Members")
    .then(response => {
        columns = startUp.DownloadColumns(response);
        membersData = startUp.DownloadData(response);
        discordMap = new Map(startUp.DownloadDiscordMap(response));
        membersCount = Object.keys(membersData).length;
        
    });
    spreadSheet.readSpreadsheet("Non-Clan Members")
    .then(response => {
        nonMembersData = startUp.DownloadData(response);
        membersCount = Object.keys(nonMembersData).length;
    })
}

function resetBot() {
    console.log('Resetting...')
    .then(msg => client.destroy())
    .then(() => client.login(config.botToken))
    .then(refreshData());
}