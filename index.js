const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();
const port = 3000;
require('dotenv').config();

// Be very careful with your bot token: NEVER share it publicly
const BOT_TOKEN = process.env.BOT_TOKEN;  
const USER_ID_TO_WATCH = process.env.USER_ID_TO_WATCH; // Replace with the user ID you want to track
const GUILD_ID = process.env.GUILD_ID; // Replace with the Guild ID of the server you are in

// Create a new Discord client with the necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
});

// Store the presence of the user you're monitoring
let userStatus = 'offline';

// Event: bot ready
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Fetch the guild and then the member
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(USER_ID_TO_WATCH);
        
        // Set the initial user status based on the member's current presence
        userStatus = member.presence ? member.presence.status : 'offline';
        console.log(`Bot started. Watching user: ${member.user.tag}. Current status: ${userStatus}`);
    } catch (error) {
        console.error('Error fetching user status:', error);
    }
});

// Event: listen for presence updates
client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (newPresence && newPresence.userId === USER_ID_TO_WATCH) {
        const member = newPresence.member; 
        console.log(`Presence update for user: ${member.user.tag}`);

        // Enhanced logging
        console.log('Old Presence:', oldPresence);
        console.log('New Presence:', newPresence);

        // Update userStatus based on newPresence
        if (newPresence.status === 'online') {
            userStatus = 'online';
            console.log(`${member.user.tag} is now online.`);
        } else {
            userStatus = 'offline';
            console.log(`${member.user.tag} is now offline.`);
        }
    }
});

// Login to Discord
client.login(BOT_TOKEN)
    .then(() => console.log('Bot successfully logged in.'))
    .catch(console.error);

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Route to check the user status
app.get('/status', (req, res) => {
    res.json({ status: userStatus });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});