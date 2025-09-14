import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import 'dotenv/config';

// Replace with your account ID (log it from the bot)
const OWNER_ID = process.env.OWNER_ID;

const normalizeId = (id) => id?.replace(/:\d+/, '');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  takeoverOnConflict: true,
  syncFullHistory: false,
  ignoreChats: false,
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

const handleMessage = async (message) => {
  try {
    const chat = await message.getChat();
    const isGroup = chat.isGroup;
    const senderId = message.fromMe
      ? message.from // you sent it
      : normalizeId(message.author || message.from); // someone else sent it

    console.log(`📩 ${chat.name || 'Private Chat'} | ${senderId}: ${message.body}`);

    if (message.body === '!tagall') {
      if (senderId !== OWNER_ID) {
        console.log('⛔ Not owner, skipping.');
        return;
      }

      if (!isGroup) {
        return message.reply('❌ This command only works in groups.');
      }

      const mentions = [];
      let text = '';

      for (const participant of chat.participants) {
        const contact = await client.getContactById(participant.id._serialized);
        mentions.push(contact);
        text += `@${contact.number} `;
      }

      await chat.sendMessage(text.trim(), { mentions });
    }
  } catch (err) {
    console.error('❌ Error handling message:', err);
  }
};

client.on('authenticated', () => {
  console.log('🔐 Authentication successful!');
});


client.on('ready', () => {
  console.log('WhatsApp bot is ready!');
});

client.on('message_create', handleMessage);
//client.on('message', handleMessage);
client.initialize();
