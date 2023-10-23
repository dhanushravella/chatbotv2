const { ValueExpression } = require('AdaptiveExpressions.Properties');
const { EventFlow } = require('Hono.Utilities.Models.Backend');
const { FlowDataV2 } = require('Hono.Utilities.Models.ConversationFlows');
const { NotificationServiceConnector } = require('Hono.Utilities.Services');
const { Dialog, DialogTurnResult } = require('botbuilder-dialogs');

class ProactiveNotificationDialog extends Dialog {
    constructor(flow, services) {
        super(flow.ObjectId);
        this._flow = flow;
        this._services = services;
    }

    async beginDialogAsync(dc, options = null, cancellationToken = undefined) {
        const notificationServiceConnector = this._services.getService(NotificationServiceConnector);

        if (!this._flow.Recipients || this._flow.Recipients.length === 0) {
            throw new Error('There are no recipients for the proactive notification');
        }

        const flowData = options;
        for (const recipient of this._flow.Recipients) {
            let email = recipient.getValue(options);
            const eventData = this._flow.EventData;

            const replyEmail = eventData.replyEmail;
            const agentName = eventData.agentName;
            const userName = eventData.userName;
            const query = eventData.query;
            const agentReply = eventData.agentReply;

            const replyEmailExp = new ValueExpression(replyEmail);
            const [reval] = replyEmailExp.tryGetValue(flowData.Dictionary);

            const agentNameExp = new ValueExpression(agentName);
            const [anval] = agentNameExp.tryGetValue(flowData.Dictionary);

            const userNameExp = new ValueExpression(userName);
            const [unval] = userNameExp.tryGetValue(flowData.Dictionary);

            const queryExp = new ValueExpression(query);
            const [qval] = queryExp.tryGetValue(flowData.Dictionary);

            const agentReplyExp = new ValueExpression(agentReply);
            const [arval] = agentReplyExp.tryGetValue(flowData.Dictionary);

            if (!email) {
                email = eventData.email;
                if (!email) {
                    email = recipient.getValue(flowData.Dictionary);
                }
            }

            eventData.replyEmail = reval?.toString();
            eventData.agentName = anval?.toString();
            eventData.userName = unval?.toString();
            eventData.query = qval?.toString();
            eventData.agentReply = arval?.toString();

            await notificationServiceConnector.sendProactiveNotificationAsync(email, this._flow.BotType, eventData);
        }

        await dc.endDialogAsync().then(() => { }).catch(() => { });
    }
}

module.exports.ProactiveNotificationDialog = ProactiveNotificationDialog;
