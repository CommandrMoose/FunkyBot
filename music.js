const { joinVoiceChannel, VoiceConnection, createAudioPlayer, createAudioResource, getVoiceConnection, AudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const playdl = require("play-dl");
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const as = import("array-shuffle");
const spotifyUrl = require("spotify-url-info");



// The global queue for the entire bot. This will be mapped with { guild.id, queue_constructor{} }
const queue = new Map();

module.exports = {

    killBot: function killBot(guild) {
        const song_queue = queue.get(guild.id);

        if (song_queue) {
            song_queue.connection.destroy();
            queue.delete(guild.id);

        }

        console.log("Killed.")

    },

    musicClear: function clearMusic(message) {
        if (!isValidCommandSend(message)) return

        const song_queue = queue.get(message.guild.id);
        song_queue.connection.destroy();
        queue.delete(message.guild.id);

        message.react("🙈");
    },

    musicSkip: function skipMusic(message) {

        if (!isValidCommandSend(message)) return

        const song_queue = queue.get(message.guild.id);
        if (!song_queue) {
            return sendTimedMessage(message.channel, 'There is no music playing!');
        }

        song_queue.songs.shift();
        video_player(message.guild, song_queue.songs[0]);
        message.react("🐵");

    },

    musicShuffle: function shuffleMusic(message) {
        if (!isValidCommandSend(message)) return

        var currentSong = queue.get(message.guild.id).songs[0];

        var raw_queue = [...queue.get(message.guild.id).songs];

        // Removes the now playing song.
        raw_queue.shift();

        if (!raw_queue) {
            return message.react("❌");
        }

        shuffle(raw_queue);


        var returnedQueue = [currentSong];

        console.log(raw_queue)

        returnedQueue.push(...raw_queue);

        queue.get(message.guild.id).songs = returnedQueue;
        sendTimedMessage(message.channel, "Shuffled the queue!");

    },

    musicQueue: function showQueue(message, showFullQueue) {

        if (!isValidCommandSend(message)) return
        const server_queue = queue.get(message.guild.id);

        if (!server_queue) {
            return message.react("❌");
        }


        let returnMsg = "```js\n";

        returnMsg += "Now playing: \n" + server_queue.songs[0].title + " > requested by " + server_queue.songs[0].requestedUser + ` ⌚ ${server_queue.songs[0].length}` + " ```\n";

        if (server_queue.songs.length > 1 && showFullQueue) {

            returnMsg += "```js\nQueued:\n"

            for (let i = 1; i < server_queue.songs.length; i++) {
                returnMsg += i + ". " + server_queue.songs[i].title + " > requested by " + server_queue.songs[0].requestedUser + ` ⌚ ${server_queue.songs[i].length}\n`;
            }

            returnMsg += "```"
        }

        sendTimedMessage(message.channel, returnMsg);
    },

    musicPlay: async function musicPlay(message, args, cmd, client) {

        if (!isValidCommandSend(message)) return

        // Check if there's any args
        if (!args.length) return sendTimedMessage(message.channel, "You must provide a song title or link!");
        console.log(args)


        // Check if this is a playlist.
        if (ytpl.validateID(args[0])) {
            console.log("Found a playlist.")
            message.channel.send(`❗❗❗  Warning: Playing large playlists will take a while to load for the bot. Please be patient! ❗❗❗ `)

            var playlist = await ytpl(args[0], { pages: 50 });
            console.log(playlist.items)

            for (let i = 0; i < playlist.items.length; i++) {
                var song = playlist.items[i];
                var fakeargs = [song.url];
                await usualSongs(message, true, fakeargs, false);
            }


            sendTimedMessage(message.channel, `Finished queuing ${playlist.items.length} songs.`)

        } else {
            console.log("Could not find a playlist.")

            var isValidURL = ytdl.validateURL(args[0]);
            await usualSongs(message, isValidURL, args, true);
        }
    }
}


/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(arr) {
    var j, x, index;
    for (index = arr.length - 1; index > 0; index--) {
        j = Math.floor(Math.random() * (index + 1));
        x = arr[index];
        arr[index] = arr[j];
        arr[j] = x;
    }
    return arr;
}


async function usualSongs(message, isValidURL, args, printAdded) {
    // If the first argument provided is a link.

    const voice_channel = message.member.voice.channel;

    //This is our server queue. We are getting this server queue from the global queue.
    const server_queue = queue.get(message.guild.id);
    let song = {};

    if (isValidURL) {

        const song_info = await playdl.video_basic_info(args[0]);
        song = { title: song_info.video_details.title, url: args[0], length: song_info.video_details.durationRaw, requestedUser: message.member.displayName }

    } else {

        let yt_info = await playdl.search(args.join(' '), { limit: 1 })

        let song_info = yt_info[0];
        console.log(song_info)

        if (song_info) {
            song = { title: song_info.title, url: song_info.url, length: song_info.durationRaw, requestedUser: message.member.displayName };
        } else {
            sendTimedMessage(message.channel, "Error finding video.")
        }
    }

    if (!server_queue) {

        const queue_constructor = {
            voice_channel: voice_channel,
            text_channel: message.channel,
            audio_player: null,
            connection: null,
            songs: [],
            relatedMessages: []
        }

        //Add our key and value pair into the global queue. We then use this to get our server queue.
        queue.set(message.guild.id, queue_constructor);
        queue_constructor.songs.push(song);

        //Establish a connection and play the song with the video_player function.
        try {

            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });


            let player = createAudioPlayer();
            connection.subscribe(player);
            queue_constructor.audio_player = player;
            queue_constructor.connection = connection;

            video_player(message.guild, queue_constructor.songs[0]);

        } catch (err) {
            queue.delete(message.guild.id);
            sendTimedMessage(message.channel, 'There was an error connecting!');
            throw err;
        }
    } else {
        server_queue.songs.push(song);

        if (printAdded) { sendTimedMessage(message.channel, `👍 **${song.title}** added to queue!`); }
        return
    }
}


const video_player = async (guild, song) => {
    const song_queue = queue.get(guild.id);

    //If no song is left in the server queue. Leave the voice channel and delete the key and value pair from the global queue.
    if (!song) {
        if (song_queue) {
            song_queue.connection.destroy();
            clearMessages(guild);
            queue.delete(guild.id);
        }

        return;
    }


    let stream = await playdl.stream(song.url, {
        filter: "audioonly"
    });

    let audio = createAudioResource(stream.stream);

    song_queue.audio_player.on(AudioPlayerStatus.Idle, () => {
        song_queue.songs.shift();
        video_player(guild, song_queue.songs[0]);
    })

    song_queue.audio_player.play(audio, { seek: 0, volume: 0.5 });

    sendTimedMessage(song_queue.text_channel, `🎶 Now playing **${song.title}** - ⌚ ${song.length}`)
}

function isValidCommandSend(message) {
    const voice_channel = message.member.voice.channel;
    if (!voice_channel) {
        message.channel.send('You need to be in a channel to execute this command!');
        return false
    }
    const permissions = voice_channel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        message.channel.send('You dont have the correct permissions');
        return false
    }

    return true;
}

function clearMessages(guild) {
    const song_queue = queue.get(guild.id);
}

function sendTimedMessage(channel, response) {

    //

    channel.send(response).then(msg => {
        setTimeout(() => msg.delete(), 10000)
    })
        .catch(console.error);

}

