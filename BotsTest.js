const fs = require('fs');
const readline = require('readline');
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const spreadsheet = require("./googleSheets");


client.on('ready', () => {
  console.log('I am ready!');
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (message.content.indexOf(config.prefix) !== 0) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === "ironman") {
    message.channel.send("BTW");
  }

  if (command === "updatecell") {
    var cellRange = args[0];
    var cellValue = args[1];

    spreadsheet.updateSpreadsheet(cellRange, [[cellValue]])
    .then(() =>  message.channel.send(cellRange + " updated to " + cellValue))
    .catch(() => message.channel.send("Error"));
  }

  if (command === "readcell") {
    var cellRange = args[0];

    spreadsheet.readSpreadsheet(cellRange)
    .then((values) => message.channel.send(cellRange + " value is " + values["data"]["values"][0][0]))
    .catch(() => message.channel.send("Cell is Empty"));
  }

  if (command === "say") {
    console.log(args);
    const sayMessage = args.join(" ");
    console.log(sayMessage);
    message.delete().catch(O_o=>{});
    message.channel.send(sayMessage);
  }
  
  if (command === "totalxp") {
    const userName = args.join(" ");
    console.log(userName);

    Osrs_Api_Test(userName)
    .then(stats => {
      message.channel.send(stats[0][2]);
    });

  }
});

client.login(config.token);