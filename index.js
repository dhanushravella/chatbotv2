const path = require('path');
const azure = require('azure-storage');
// const { TableStorage } = require('botbuilder-azure');
const {
    BlobStorage
} = require('botbuilder-azure');

const dotenv = require('dotenv');
// Import required bot configuration.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({
    path: ENV_FILE
});

const restify = require('restify');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const {
    CloudAdapter,
    ConversationState,
    UserState,
    ConfigurationBotFrameworkAuthentication
} = require('botbuilder');

// This bot's main dialog.
const {
    MainBot
} = require('./bot');
const NotificationService = require('./controllers/notificationController');
const ProactiveNotificationService = require('./controllers/proactiveNotificationController');

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights. See https://aka.ms/bottelemetry for telemetry
    //       configuration instructions.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    await conversationState.delete(context);
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

const blobStorage = new BlobStorage({
    containerName: 'chatbot', // Replace with your Blob Storage container name
    storageAccountOrConnectionString: process.env.AzureStringConnection
});
const storageConnectionString = process.env.AzureStringConnection;
console.log('process.env.AzureStringConnection:', storageConnectionString);
const tableService = azure.createTableService(storageConnectionString);
// const conversationReferences = [];
const conversationState = new ConversationState(blobStorage);
const userState = new UserState(blobStorage);
// entityCreation(tableClient,userState)
const myBot = new MainBot(conversationState, userState, tableService, adapter);

/// ///////////////
// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res, (context) => myBot.run(context));
});

server.post('/api/notify', async (req, res) => {
    try {
        const request = req.body;
        let success = false;

        if (request.Reliable) {
            // If Service Bus is available, enqueue the notification
            // You can replace this with your own implementation for queuing the notification
            // success = await enqueueNotification(request);
        } else {
            // Without Service Bus Message Queue, execute the notification directly
            success = await NotificationService.ExecuteNotificationAsync(request, tableService, adapter);

            if (!success) {
                // If the notification failed, return status code 417
                return res.status(417);
            }
        }
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
        res.end();
        // return res.status(200).send('Message sent successfully');
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            Success: false
        });
    }
});

server.post('/api/proactiveNotification', async (req, res) => {
    try {
        let success;
        const request = req.body; // Assuming you have middleware for parsing JSON request body
        if (request.Reliable) {
            console.log('(ProactiveController) SendProactiveNotification: Using ServiceBus for notification for' + request.recipient);
            // Implement EnqueueBotCommandMessage logic
            //   await EnqueueBotCommandMessage({
            //     Operation: 'OperationProactive',
            //     Data: request
            //   });

            success = true;
        } else {
            success = await ProactiveNotificationService.ExecuteProactiveAsync(request);
            if (!success) {
                console.log('(ProactiveController) SendProactiveNotification: There was an issue while sending proactive');
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(417);
                res.write('<html><body><h1>Unable to send Proactive messages.</h1></body></html>');
                res.end();
            }
        }
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
        res.end();
    } catch (e) {
        console.error('(ProactiveController) SendProactiveNotification for', e);
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(417);
        res.write('<html><body><h1>' + '(ProactiveController) SendProactiveNotification for: ' + e + '</h1></body></html>');
        res.end();
    }
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);
    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    await streamingAdapter.process(req, socket, head, (context) => myBot.run(context));
});
