import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

// Initialize the client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  takeoverOnConflict: true,
  syncFullHistory: true,
  ignoreChats: false,
});

// Generate QR Code
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// Bot ready
client.on('ready', async () => {
  console.log('✅ WhatsApp Bot is ready!');
  const chats = await client.getChats();
  const groups = chats.filter(chat => chat.isGroup);
  console.log(`📦 Joined ${groups.length} group(s).`);
});

// Listen to all messages (others and yourself)
const handleMessage = async (message) => {
  try {
    const chat = await message.getChat();

    console.log(`📩 ${chat.name || 'Private Chat'} | ${message.from}: ${message.body}`);

    if (message.body === '!tagall') {
      if (!chat.isGroup) {
        return message.reply('❌ This command only works in groups.');
      }

      let mentions = [];
      let text = '';

      for (const participant of chat.participants) {
        const contact = await client.getContactById(participant.id._serialized);
        mentions.push(contact);
        text += `@${contact.number} `;
      }

      await chat.sendMessage(text, { mentions });
    }
  } catch (err) {
    console.error('❌ Error handling message:', err);
  }
};

//client.on('message', handleMessage);         // For messages from others
client.on('message_create', handleMessage);  // For your own messages

client.initialize();
