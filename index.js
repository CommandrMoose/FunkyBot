const { Client, Intents, VoiceState } = require("discord.js");
const botclient = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
const { joinVoiceChannel, VoiceConnection, createAudioPlayer, createAudioResource, getVoiceConnection } = require("@discordjs/voice");
const { musicPlay, musicSkip, musicClear, musicQueue, killBot, musicShuffle } = require("./music");
const player = createAudioPlayer();
const dotenv = require('dotenv').config();


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

    switch (command) {

        case `leave`:
            killBot(message.guild);
            break;

        case `fuckoff`:
            killBot(message.guild);
            break;

        case `clear`:
            musicClear(message);
            break;

        case 'skip':
            musicSkip(message);
            break;

        case 'shuffle':
            musicShuffle(message);
            break;

        case 'play':
            musicPlay(message, args, "play", botclient);
            break;

        case "p":
            musicPlay(message, args, "play", botclient);
            break;

        case 'queue':
            musicQueue(message, true);
            break;
        case 'q':
            musicQueue(message, true);
            break;
        case 'np':
            musicQueue(message, false);
            break;
        case 'help':
            message.channel.send("```Current commands\n-p <link, or search>     : Plays a song or adds to queue. Will take Youtube playlists! \n-skip                    : skips the playing song\n-clear\n-np                      : Shows the current playing song\n-leave                   : Disconnects the bot\n-q                       : Displays the current queue (can be a little broken)\n-shuffle                 : Shuffles the queue```");
            break;
    }
})