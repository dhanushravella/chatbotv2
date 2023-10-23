const { ValueExpression } = require('adaptive-expressions');
const NotificationService = require('../controllers/notificationController');
const { Dialog } = require('botbuilder-dialogs');
const { CloudAdapter, ConfigurationBotFrameworkAuthentication } = require('botbuilder');
const azure = require('azure-storage');
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env);
const storageConnectionString = process.env.AzureStringConnection;
const tableService = azure.createTableService(storageConnectionString);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);

class NotificationDialog extends Dialog {
    constructor(flow, services) {
        super(flow.objectId);
        this._flow = flow;
        this._services = services;
        // this.conversationReferences = {};
    }

    async beginDialog(dc, options = null, cancellationToken = undefined) {
        const notificationServiceConnector = NotificationService;

        if (!this._flow.recipients || this._flow.recipients.length === 0) {
            // const flowData = options;
            // const valueExpression = new ValueExpression('${result.feedback}');

            return await dc.endDialogAsync().then(() => { }).catch(() => { });
            // Uncomment the line below if you want to throw an exception when there are no recipients.
            // throw new Error("There are no recipients to send notification");
        }

        for (const recipient of this._flow.recipients) {
            const flowData = options;
            var replyEmailExp = new ValueExpression(recipient);
            var email = replyEmailExp.getValue(flowData.dictionary);
            const currentFlow = flowData.currentFlow;
            const eventData = currentFlow.eventData;
            // const text = eventData.text;
            // const valueExpression = new ValueExpression(text);

            if (!email) {
                email = eventData.email;
                if (!email) {
                    email = recipient.getValue(flowData.Dictionary);
                }
            }

            // const val = valueExpression.tryGetValue(flowData.Dictionary);
            eventData.emailId = email;
            // const conversationReference = TurnContext.getConversationReference(dc.context.activity);
            // this.conversationReferences[conversationReference.conversation.id] = conversationReference;
            await notificationServiceConnector.ExecuteNotificationAsync(eventData, tableService, adapter);
            return await dc.endDialog();
        }

        return await dc.endDialog();
    }
}

module.exports.NotificationDialog = NotificationDialog;
