# Abyssal Bot

## DISCLAIMER

- This bot is not designed to be reconfigurable in other cases, I am specifically making it to suit our needs with the clan's discord
- I am not an experience programmer. I have only properly started programming for about 6 months, and this is the first time I have used discord.js, so the code is certainly not efficient, or laid out well. Especially right now since I focused more on getting an initial version released rather than write the code efficiently. Now that the bot is running, I will focus more on making the bot more scalable as I add more features to it!
- The bot is currently in "Alpha". It is being run on the server with the few commands it currently has and is likely to have issues. I am doing this is to make the process of finding these issues faster, and give the members the opportunity to provide feedback on current and new features.

## Overview

This bot is designed to make the organisitonal side of running the clan and discord server significantly easier, while alsp providing some cool features for the members to use, hopefully encourage more activity in the discord server, and attracting more members in general.

I am currently focused on the Admin side, as the organisational part of the clan has been signficantly lacking due to the manual work that was required. It has been a pressing issue to come up with a solution to this problem, and this is it! There has already been signficant improvements in certain commonly performed tasks, such as adding new members, adding to event attendance and checking activity. Ther are plans to provide more uses to members in the future.

## Commands

### Owner only:
These commands are only able to be used by me. This is because they are ways for me to debug/refresh the bot, or the command only needs be to done on rare occasions.

#### `.activity`
This command obtains all the total xp of all the accounts on the Members sheet using the osrs hiscores API. Then calculates the different in total xp from the previous week and detemines the activity of the user. If the user does not exist in the hiscores API (their name changed), then it will add it to a list of names, which is shown after the command has completed.

#### `.refresh`
This command refreshes the local data that the bot stores in respect with the data on the spreadsheet. This is used for when I manually change any values on the spreadsheet itself as the bot cannot detect the changes and the local data would be out of sync with the spreadsheet data if this command is not used.


### Admin only:
These commands can only be used by Gold and Silver Stars. They are commands that affect key parts of members, such as their rank.

#### `.changerank <USERNAME>, <RANK>`
This command changes the rank of the username. Where `<USERNAME>` is the username of the person you wish to change the rank of and `<RANK>` is what you want to change their rank to.
TODO: - Limit the ranks that can be changed to to ensure the rank given is actually a part of our ranking system.
      - Update their role in the discord server and add a task to update the player in game.

#### `.changename <OLD_USERNAME>, <NEW_USERNAME>`
This command changes the username of the member from `<OLD_USERNAME>` to `<NEW_USERNAME>`.
This is the same command as the one given access to members, but you do not require the account ot be linked to your discord to change the name.

#### `.changetimezone <USERNAME>, <TIMEZONE>`
This comand changes the timezone of the member.
This is the same command as the one given access to members, but you do not require the account ot be linked to your discord to change the timezone of the member.

### Moderator only:
These commands can be done only be used by any star. It enables the stars to change/check basic info on users, such as adding attendance, or changing the name of any user.

#### `.addattendance <USERNAME>`
This commands add an attendance to the username specified. This should be done after a star organised event, applying this command to all the people that came!

#### `.info <USERNAME>`
This command retrieves the info of any member in the clan.
This is the same command as the one that is given access to members, but you do not require the account to be linked to your discord to view it.

#### `.addmember <USERNAME>`
This command will attempt to the add the username specified. How it does this depends on the current status of the username.
- If the username is not located anywhere on the sheet, it will simply add the username to the members sheet with the stats of a new member. It will then add their username to the list of usernames to add in game.
- If the username is located in the non-members sheet, it will move that user's row into the members sheet, assuming they are not banned. It will make approriate changes to their rank if necessary.
- If the username is already located in the members sheet, it will notify you and do nothing.


### Members:
These commands can be used by anyone in the clan. They are more specifically designed to provide cool features to the members, as well as enable them to keep their data updated to ensure they are able to use them.

#### `.linkdiscord <USERNAME>`
This command links your discord the username specified. This is important as you cannot use a lot of the other commands without doing this. If a discord is already linked to that username, it won't let you override it.

#### `.addrole <ROLE>`
This command gives you a role

#### `.removerole <ROLE>`

#### `.info <USERNAME>`

#### `.changename <OLD_USERNAME>, <NEW_USERNAME>`

#### `.changetimezone <USERNAME>`

