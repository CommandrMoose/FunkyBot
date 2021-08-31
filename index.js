const { Client, Intents } = require("discord.js");
const botclient = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
const { joinVoiceChannel, VoiceConnection, createAudioPlayer, createAudioResource, getVoiceConnection } = require("@discordjs/voice");
const { musicPlay, musicSkip, musicClear, musicQueue, killBot } = require("./music");


const player = createAudioPlayer();

const token = `ODgwMjA4MzU1MjU4NDAwODA5.YSa76Q.qGxHmsbavrEenuWQEYg7RNcIqUs`;

let PREFIX = "-";
var servers = {};

let connection = undefined;

botclient.on('ready', () => {
    console.log("Bot enabled.");

})

botclient.login(token);


botclient.on('voiceStateUpdate', (oldstate, newstate) => {
    console.log(oldstate);
    console.log(newstate);

    if (!newstate.channelId) {
        killBot(newstate.guild);
    }
})

botclient.on('messageCreate', message => {
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

        case 'play':
            //joinVoice(args, message);
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

        case 'who':
            console.log(message.member.displayName);
            break;
    }
})