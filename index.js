const express = require('express');
const { Client, GatewayIntentBits, WebhookClient } = require('discord.js');
const app = express();
const port = 3000;
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;  
const USER_ID_TO_WATCH = process.env.USER_ID_TO_WATCH;
const GUILD_ID = process.env.GUILD_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Create a new Discord client with the necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize the WebhookClient using the WEBHOOK_URL
const webhookClient = new WebhookClient({ url: WEBHOOK_URL });

let userStatus = 'offline';
let lastMessageId = null;  // Store the last message ID sent to the webhook

// Function to format the current time nicely
function formatTime() {
    const now = new Date();
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Europe/Amsterdam',
        hour12: false // Use 24-hour format
    }).format(now);
}

// Function to send or edit a message in the webhook
async function sendOrEditWebhookNotification(status, member) {
    const embed = {
        title: 'Welcomer Status Update',
        description: `**The Welcomer bot is now**: ${status}`,
        color: status === 'online' ? 0x00FF00 : 0xFF0000,
        timestamp: new Date(),
        footer: {
            text: `Last updated at: ${formatTime()}`,
        },
        fields: [
            { name: 'Bot Name', value: `${member.user.tag}`, inline: false },
            { name: 'Bot ID', value: `${USER_ID_TO_WATCH}`, inline: false },
            { name: 'Current Status', value: `${status.charAt(0).toUpperCase() + status.slice(1)}`, inline: false },
        ]
    };

    try {
        if (lastMessageId) {
            // Edit the existing message using the WebhookClient
            const fetchedMessage = await webhookClient.fetchMessage(lastMessageId);
            await webhookClient.editMessage(fetchedMessage.id, { embeds: [embed] });
            console.log(`Webhook message edited: ${status}`);
        } else {
            // Send a new message if no previous message exists
            const sentMessage = await webhookClient.send({
                embeds: [embed],
            });
            lastMessageId = sentMessage.id; // Store the ID of the new message
            console.log(`Webhook notification sent: ${status}`);
        }
    } catch (error) {
        console.error('Error sending or editing webhook notification:', error);
    }
}

// Periodically update the webhook every 10 seconds
setInterval(async () => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(USER_ID_TO_WATCH);
        
        // Get the current status of the member
        const currentStatus = member.presence ? member.presence.status : 'offline';

        // Always edit with the current status if we have a lastMessageId
        await sendOrEditWebhookNotification(currentStatus, member);
    } catch (error) {
        console.error('Error fetching user status for periodic update:', error);
    }
}, 10000); // 10000 milliseconds = 10 seconds

// Event: bot ready
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Initial status check
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(USER_ID_TO_WATCH);
        
        userStatus = member.presence ? member.presence.status : 'offline';
        console.log(`Bot started. Watching user: ${member.user.tag}. Current status: ${userStatus}`);
        
        // Send initial message to the webhook
        await sendOrEditWebhookNotification(userStatus, member); // Pass member here
    } catch (error) {
        console.error('Error fetching user status on bot start:', error);
    }
});

// Event: listen for presence updates
client.on('presenceUpdate', async (oldPresence, newPresence) => {
    if (newPresence && newPresence.userId === USER_ID_TO_WATCH) {
        const member = newPresence.member; 
        console.log(`Presence update for user: ${member.user.tag}`);

        // Update userStatus based on newPresence
        userStatus = newPresence.status;
        console.log(`${member.user.tag} is now ${userStatus}.`);
        
        // Edit the message with the updated status
        await sendOrEditWebhookNotification(userStatus, member); // Pass member here
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