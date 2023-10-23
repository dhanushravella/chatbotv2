const { MessageFactory, CardFactory } = require('botbuilder');

const { MicrosoftAppCredentials, ConnectorClient } = require('botframework-connector');

// Define an async function to send a message to a user's conversation

function createConnectorClient(profile) {
    MicrosoftAppCredentials.trustServiceUrl(profile.serviceUrl);
    var credentials = new MicrosoftAppCredentials('2d4d0e2c-d94e-467d-9427-6af36a46f234',
        'nfs8Q~n.-OhEE.L6VYh4O1vLUXBeGst_QEcmDdkN', null, null);
    const connectorClient = new ConnectorClient(credentials, { baseUri: profile.serviceUrl });

    return connectorClient;
}

async function SendToConvoSubroutineAsync(profile, reply, adapter) {
    try {
        const userAccount = {
            id: profile.ToId._,
            name: profile.ToName._
        };
        const botAccount = {
            id: profile.FromId._,
            name: profile.FromName._
        };

        const connector = createConnectorClient(profile);

        // const conversationId = profile.ConversationId;

        if (profile.ConversationId && profile.ChannelId) {
            // If conversation ID and channel ID were previously stored, use them.
            reply.channelId = profile.ChannelId._;
        } else {
            // Conversation ID was not stored previously, so create a new conversation.
            const newConversation = await connector.createDirectConversationAsync(
                botAccount, // Bot's channel account
                userAccount // User's channel account
            );
            console.log(newConversation);
            // conversationId = newConversation.id;
        }

        reply.from = botAccount;
        reply.recipient = userAccount;
        // reply.conversation = {
        //    id: conversationId._
        // };
        // Generate a GUI number and write to reply.id so that we can track the message
        reply.id = new Date().toDateString(); // Placeholder text
        // const roster = await connector.conversations.getConversationMembers(stepContext.context.activity.conversation.id);

        // const conversationResource = await connector.conversations.createConversation(parameters);
        // Send the message
        // await connector.conversations.sendToConversation(conversationId._, reply);
        // const reference = conversationReferences[req.body.refId];
        var conversationReference = JSON.parse(profile.ConversationReference._);
        await adapter.continueConversationAsync('2d4d0e2c-d94e-467d-9427-6af36a46f234', conversationReference, async context => {
            await context.sendActivity(reply);
        });
    } catch (ex) {
        console.error(ex);
    }
}

async function SendGeneralNotificationAsync(profile, data, adapter) {
    let message = 'PLACEHOLDER'; // Placeholder text
    // let langCode = 1;

    switch (data.type) {
    case 'Message':
        message = data.message;
        break;
    case 'LocalizedMessage':
        // var user = await TeamsInfo.getUser(profile);
        // if (user) {
        //     langCode = user.language;
        // }

        if (!data.Text) {
            // You need to implement localization logic here
            // For example, using a localization module and key
            // message = getLocalizedQuestion(data.LocalizationModule, data.LocalizationKey, langCode);
        } else {
            message = data.Text;
        }

        // Perform string replacements, if any
        if (data.LocalizationReplacements) {
            // You need to implement SmartFormat replacements
            // message = smartFormat(message, data.LocalizationReplacements);
        }
        break;
    }

    // Create a new message activity
    const reply = MessageFactory.text(message);

    if (data.AttachmentUrl) {
        const attachmentType = data.AttachmentUrl.split('.').pop().toLowerCase();
        const attachments = [];

        switch (attachmentType) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            attachments.push({
                contentType: 'image/jpeg',
                contentUrl: data.AttachmentUrl
            });
            break;
        case 'pdf':
            // Example of sending an Adaptive Card for PDF
            var adaptiveCardJson = {
                type: 'AdaptiveCard',
                body: [
                    {
                        type: 'TextBlock',
                        text: 'Attachment: PDF',
                        size: 'large',
                        weight: 'bolder'
                    }
                ],
                actions: [
                    {
                        type: 'Action.Submit',
                        title: 'View PDF',
                        data: {
                            msteams: {
                                type: 'task/fetch'
                            }
                        }
                    }
                ]
            };
            attachments.push(CardFactory.adaptiveCard(adaptiveCardJson));
            break;
        case 'mp3':
        case 'wav':
            attachments.push({
                contentType: 'audio/mpeg3',
                contentUrl: data.AttachmentUrl
            });
            break;
        case 'mp4':
            attachments.push({
                contentType: 'video/mp4',
                contentUrl: data.AttachmentUrl
            });
            break;
        default:
            attachments.push({
                contentType: 'image/jpeg',
                contentUrl: data.AttachmentUrl
            });
            break;
        }

        reply.attachments = attachments;
    }

    await SendToConvoSubroutineAsync(profile, reply, adapter);
}

async function GetDetailsFromDbAsync(PartitionKey, RowKey, tableService) {
    const tableName = 'UserProfile';
    // Check if the entity exists in the Azure Table
    return new Promise((resolve) => {
        tableService.retrieveEntity(tableName, PartitionKey, RowKey, (error, result, response) => {
            if (!error) {
                console.log('Record Already exists');

                resolve(result);
            } else if (error.statusCode === 404) {
            // Entity doesn't exist; insert it
                resolve(null);
            } else {
                console.error('Error checking entity existence:', error);
                resolve(null);
            }
        });
    });
}

// ExecuteNotificationAsync equivalent
async function ExecuteNotificationAsync(data, tableService, adapter) {
    let success = false;
    const userProfiles = [await GetDetailsFromDbAsync(data.emailId, data.emailId, tableService)];

    for (const prof of userProfiles) {
        // if (!prof.IsValidProfile(BOT_ID) || prof.ChannelId === Channels.Directline) {
        //     continue;
        // }

        success = true; // There is at least one valid proifle

        // Simulate sending notifications and adding to the database asynchronously
        (async () => {
            try {
                // const reference = conversationReferences[prof.ConversationId._];
                await SendGeneralNotificationAsync(prof, data, adapter);
                // await _utilityServices.BotDbService.AddNotificationToDbAsync(
                //     prof,
                //     'General', // NotificationType
                //     true, // Success flag
                //     message
                // );
            } catch (error) {
                success = false;
                console.log(error);
                // handleError(error);
            }
        })();
    }

    return success;
}

module.exports = { ExecuteNotificationAsync };
