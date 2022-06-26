const { Client, Intents, VoiceState } = require("discord.js");
const botclient = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
const { joinVoiceChannel, VoiceConnection, createAudioPlayer, createAudioResource, getVoiceConnection } = require("@discordjs/voice");
const { musicPlay, musicSkip, musicClear, musicQueue, killBot, musicShuffle } = require("./music");
const player = createAudioPlayer();
const dotenv = require('dotenv').config();


//const token = process.env.TOKEN;
const token = process.env.TOKEN;
console.log(token);
const clientID = '880208355258400809'

let PREFIX = "-";
var servers = {};

let connection = undefined;


botclient.login(token);

botclient.on('ready', () => {
    console.log("Bot enabled.");

    botclient.user.setActivity('-help', { type: 'LISTENING' })
})


botclient.on('voiceStateUpdate', (oldstate, newstate) => {

    if (!newstate.channelId && oldstate.member.id == clientID) {
        killBot(newstate.guild);
    }
})

botclient.on('messageCreate', message => {
    if (!message.content.startsWith(PREFIX)) return;
    let args = message.content.substring(PREFIX.length).split(' ');
    let command = args[0];
    args.shift();

    if (command == "leave" || command == "fuckoff") {
        killBot(message.guild);
    }

    if (command == "clear") {
        musicClear(message);
    }

    if (command == "skip" || command == "s") {
        musicSkip(message);
    }

    if (command == "shuffle") {
        musicShuffle(message);
    }

    if (command == "play" || command == "p") {
        musicPlay(message, args);
    }

    if (command == "queue" || command == "q") {
        musicQueue(message, true);
    }

    if (command == "np") {
        musicQueue(message, false);
    }

    if (command == "help") {
        displayHelp(message.channel);
    }

})

function displayHelp(channel) {
    channel.send("```Current commands\n-p <link, or search>     : Plays a song or adds to queue. Will take Youtube playlists! \n-skip                    : skips the playing song\n-clear\n-np                      : Shows the current playing song\n-leave                   : Disconnects the bot\n-q                       : Displays the current queue (can be a little broken)\n-shuffle                 : Shuffles the queue```");
}