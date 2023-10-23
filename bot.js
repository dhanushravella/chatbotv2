// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    ActionTypes,
    ActivityHandler,
    MessageFactory,
    CardFactory,
    TeamsInfo,
    TurnContext
} = require('botbuilder');
const path = require('path');
// const { TableClient } = require("@azure/data-tables");

// Read environment variables from .env file
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({
    path: ENV_FILE
});

const { DialogSet } = require('botbuilder-dialogs');
// const CustomChoiceDialog = require('./dialogs/choiceDialog');
// const CustomInputDialog = require('./dialogs/inputDialog');
const {
    RootDialog
} = require('./dialogs/rootDialog');
// const { CustomTextDialog } = require('./dialogs/textDialog');
// const CustomApiDialog = require('./dialogs/callApiDialog');
// const AdaptiveCardDialog = require('./dialogs/adaptiveCardDialog');
const userAuthentication = require('./dialogs/userAuthentication');

// // Load your use cases from JSON files
const intentClassifier = require('./utils/nlp');
const intentApplyLeave = require('./useCases/applyLeave.json');
const intentApplyAr = require('./useCases/applyAr.json');
const intentApplyOd = require('./useCases/applyOd.json');
const intentCalendar = require('./useCases/calendar.json');
const chatGptCardjson = require('./resources/localization/en/chatGptCard.json');

// const intentGreet = require('./useCases/greet.json');
const intentMyProfile = require('./useCases/myProfile.json');
const intentLeaveBalance = require('./useCases/leaveBalance.json');
const intentHolidays = require('./useCases/holidays.json');
// const notificationTest = require('./useCases/notificationTest.json');
const intentAnniversary = require('./useCases/anniversary.json');
const intentShowAppliedAr = require('./useCases/showAppliedAr.json');
const intentCancelOd = require('./useCases/cancelOd.json');
const welcomeCardjson = require('./resources/welcomeCard.json');

const intentShowAppliedLeave = require('./useCases/showAppliedLeave.json');
const intentShowAppliedOd = require('./useCases/showAppliedOd.json');
const intentCompanyDirectory = require('./useCases/companyDirectory.json');

// const { Json } = require('adaptive-expressions/lib/builtinFunctions');

const quesReply = require('./resources/localization/quesReply');
const gptResponse = require('./utils/gpt');

global.activityId = '';

class MainBot extends ActivityHandler {
    constructor(conversationState, userState, tableService, adapter) {
        super();
        this.adapter = adapter;

        // The state management objects for the conversation and user state.
        this.userState = userState;
        this.conversationState = conversationState;

        // Create a new dialogState
        this.dialogState = this.conversationState.createProperty('DialogState');
        // Create a new DialogSet

        // this.conversationReferences = conversationReferences;
        // this.onConversationUpdate(async (context, next) => {
        //     this.addConversationReference(context.activity);

        //     await next();
        // });

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            // this.addConversationReference(context.activity);
            const conversationReference = TurnContext.getConversationReference(context.activity);

            // var userProfile = await this.userProfileAccessor;
            // const conversationData = await this.conversationDataAccessor;
            var AuthenticationDetails = null;
            if (context.activity.type === 'message') {
                try {
                    // if context activity channel is emulator then get the user details from the emulator
                    if (context.activity.channelId === 'emulator') {
                        AuthenticationDetails = {
                            senderData: {
                                info: {
                                    access_token: '16dc077877fbc745cf71d5040afadc',
                                    comp_code: 'sequelone',
                                    account_id: '62cd594f8b7885adff870db1',
                                    EMP_CODE: 'SMS0919',
                                    EMP_NAME: 'Shashank Singh',
                                    EMPIMAGE: 'https://sequelonehonohr.com/assets/uploads/profile_pictures/d7f0d73ce08c1e92fe92de6f29dc5f20.png',
                                    DOB: '2001-04-12',
                                    OEMAILID: 'shashank.singh@hono.ai'
                                },
                                source_language: '{"key": "en", "value": "english"}',
                                platform: 'msteams'
                            }
                        };
                    } else {
                        // if context activity channel is teams then get the user details from the teams
                        // Get the details from TeamInfo only once and store it in the state if the user info is not found or if the user info is not present in the state
                        console.log('User State', this.userState.user);
                        if (this.userState.user === undefined || this.userState.user === null) {
                            try {
                                const member = await TeamsInfo.getMember(context, context.activity.from.id);
                                const userEmail = member.email;

                                AuthenticationDetails = await userAuthentication.getTeamsAuth(userEmail);
                            } catch (error) {
                                console.log('++++ Error +++', error);
                            }
                            console.log('*** AuthenticationDetails ******', AuthenticationDetails);

                            this.userState.user = AuthenticationDetails;
                        }
                    }
                } catch (error) {
                    console.log('++++ Error +++', error);
                    AuthenticationDetails = {
                        senderData: {
                            info: {
                                access_token: '16dc077877fbc745cf71d5040afadc',
                                comp_code: 'sequelone',
                                account_id: '62cd594f8b7885adff870db1',
                                EMP_CODE: 'SMS0919',
                                EMP_NAME: 'Shashank Singh',
                                EMPIMAGE: 'https://sequelonehonohr.com/assets/uploads/profile_pictures/d7f0d73ce08c1e92fe92de6f29dc5f20.png',
                                DOB: '2001-04-12',
                                OEMAILID: 'shashank.singh@hono.ai'
                            },
                            source_language: '{"key": "en", "value": "english"}',
                            platform: 'msteams'
                        }
                    };

                    this.userState.user = AuthenticationDetails;
                }

                var userInputText = context.activity.text;
                console.log('User Text--->', userInputText);
                var cardReturnValue = context.activity.value;
                console.log('card value--->', cardReturnValue);

                // Creating table in azure
                // Create an instance of the Azure Table Service
                // console.log(context._activity);

                // Create a table name (replace 'mytable' with your preferred table name)
                const tableName = 'UserProfile';

                // For example, you can insert data into the Azure Storage table.
                const entity = {
                    PartitionKey: { _: this.userState.user.senderData.info.OEMAILID },
                    RowKey: { _: this.userState.user.senderData.info.OEMAILID },
                    EmailId: { _: this.userState.user.senderData.info.OEMAILID },
                    EmpId: { _: this.userState.user.senderData.info.EMP_CODE },
                    Name: { _: this.userState.user.senderData.info.EMP_NAME },
                    FromId: { _: context._activity.from.id },
                    ToId: { _: context._activity.recipient.id },
                    FromName: { _: context._activity.from.name },
                    ToName: { _: context._activity.recipient.name },
                    ServiceUrl: { _: context._activity.serviceUrl },
                    ChannelId: { _: context._activity.channelId },
                    ConversationId: { _: context._activity.conversation.id },
                    OrganizationName: { _: this.userState.user.senderData.info.comp_code },
                    ConversationReference: { _: JSON.stringify(conversationReference) }

                };

                // Check if the entity exists in the Azure Table
                tableService.retrieveEntity(tableName, entity.PartitionKey._, entity.RowKey._, (error, result, response) => {
                    if (!error) {
                        console.log('Record Already exists');
                        // Entity exists; update it
                        tableService.replaceEntity(tableName, entity, (updateError, updateResult, updateResponse) => {
                            if (!updateError) {
                                console.log('Entity updated successfully');
                            } else {
                                console.error('Error updating entity:', updateError);
                            }
                        });
                    } else if (error.statusCode === 404) {
                        // Entity doesn't exist; insert it
                        tableService.insertEntity(tableName, entity, (insertError, insertResult, insertResponse) => {
                            if (!insertError) {
                                console.log('Entity inserted successfully');
                            } else {
                                console.error('Error inserting entity:', insertError);
                            }
                        });
                    } else {
                        console.error('Error checking entity existence:', error);
                    }
                });

                if (cardReturnValue !== null && cardReturnValue !== undefined) {
                    try {
                        var pleaseWaitCardjson = {
                            type: 'AdaptiveCard',
                            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                            version: '1.3',
                            body: [{
                                type: 'TextBlock',
                                text: 'Please Wait..',
                                wrap: true,
                                style: 'heading'
                            }]
                        };
                        var pleaseWaitCard = MessageFactory.attachment(CardFactory.adaptiveCard(pleaseWaitCardjson));
                        pleaseWaitCard.id = global.activityId;
                        console.log('=== pleaseWaitCard ====>', pleaseWaitCard);
                        await context.updateActivity(pleaseWaitCard);
                    } catch (error) {
                        console.error('Error:', error);
                    }

                    switch (cardReturnValue.type) {
                    case 'chatgpt':
                        var getGptResponse = await gptResponse.getChatGptResponse(cardReturnValue.userQues);
                        console.log('****** ChatGpt Response ******>', getGptResponse);
                        await context.sendActivity(getGptResponse);
                        return;
                    case 'ChatGPT':
                        var chatGptCard = MessageFactory.attachment(CardFactory.adaptiveCard(chatGptCardjson));
                        var temp = await context.sendActivity(chatGptCard);
                        global.activityId = temp.id;
                        console.log('++++++++ ChatGPT global.activityId ++++++++', global.activityId);
                        return;
                    default:
                        userInputText = cardReturnValue.type;
                    }
                }
                var userIntent = 'greet';
                try {
                    // console.time('NLPcallstart');
                    userIntent = await intentClassifier.intentClassify(userInputText);
                    // console.timeEnd('NLPcallstart');
                    this.conversationState.LastLuisRes = userIntent;

                    userIntent = userIntent.result.prediction.topIntent;
                } catch (error) {
                    console.error('-- Error getting CLU Responce --->');
                }

                console.log('***** CLU Intent *******', userIntent);
                // userIntent = userIntent.result.prediction.topIntent;
                this.dialog = new RootDialog('rootDialog', this.dialogState);
                this.dialogs = new DialogSet();
                this._dialogs = new DialogSet(this.dialogState);
                this._dialogs.add(this.dialog);
                const dc = await this._dialogs.createContext(context);
                dc.context.turnState.UserData = this.userState;
                dc.context.turnState.ConversationData = this.conversationState;
                if (userIntent === 'exit') {
                    var anyText = await quesReply.getRandomReply('general', 'anything', 'en', AuthenticationDetails);

                    var exitText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                    await dc.context.sendActivity(exitText);
                    await dc.context.sendActivity(anyText);
                    return await dc.cancelAllDialogs();
                } else if (userIntent === 'signoff') { // Write an else if condition to check if typed message is SIGNOFF then cancel all the dialogs and send a reply to the user
                    await dc.context.sendActivity('You have been signed off successfully. Type a message to login again');
                    delete this.userState.user;
                    return await dc.cancelAllDialogs();
                } else if (dc.stack.length !== 0) {
                    // Check the current active dialog type
                    console.log('dc.activeDialog is active');

                    return await dc.continueDialog();
                } else {
                    let useCaseFlows = [];
                    var greetText = '';
                    anyText = await quesReply.getRandomReply('general', 'anything', 'en', AuthenticationDetails);
                    switch (userIntent) {
                    case 'greet':
                        greetText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                        return await context.sendActivity(greetText);

                    case 'pleasantries':
                        greetText = await quesReply.getCurrentTimeZoneGreeting(context.activity.localTimezone);
                        var pleasantriesText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                        pleasantriesText = pleasantriesText.replace('{pleasantriesText}', greetText);
                        return await context.sendActivity(pleasantriesText);

                    case 'praise':
                        var praiseText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                        return await context.sendActivity(praiseText);

                    case 'scold':
                        var scoldText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                        return await context.sendActivity(scoldText);

                    case 'thanks':
                        var thanksText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                        await context.sendActivity(thanksText);
                        return await context.sendActivity(anyText);

                    case 'exit':
                        exitText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                        await context.sendActivity(exitText);
                        return await context.sendActivity(anyText);

                    case 'bye':
                        var byeText = await quesReply.getRandomReply('general', userIntent, 'en', AuthenticationDetails);
                        return await context.sendActivity(byeText);

                    case 'help':
                        var helpText = await quesReply.getRandomReply('help', userIntent, 'en', AuthenticationDetails);
                        var helpCard = await context.sendActivity(helpText);
                        global.activityId = helpCard.id;
                        console.log('++++++ help global.activityId++++++++>', global.activityId);
                        return;

                    case 'chatGpt':
                        var chatGptNewCard = MessageFactory.attachment(CardFactory.adaptiveCard(chatGptCardjson));
                        return await context.sendActivity(chatGptNewCard);

                    case 'leave_balance':
                        useCaseFlows = intentLeaveBalance;
                        break;

                    case 'my_profile':
                        useCaseFlows = intentMyProfile;
                        break;

                    case 'apply_leave':
                        useCaseFlows = intentApplyLeave;
                        break;

                    case 'apply_ar':
                        useCaseFlows = intentApplyAr;
                        break;

                    case 'apply_od':
                        useCaseFlows = intentApplyOd;
                        break;
                    case 'calendar':
                        useCaseFlows = intentCalendar;
                        break;
                    case 'holidays':
                        useCaseFlows = intentHolidays;
                        break;
                    case 'anniversary':
                        useCaseFlows = intentAnniversary;
                        break;
                    case 'showAppliedAr':
                        useCaseFlows = intentShowAppliedAr;
                        break;
                    case 'cancelOd':
                        useCaseFlows = intentCancelOd;
                        break;
                    case 'showAppliedLeave':
                        useCaseFlows = intentShowAppliedLeave;
                        break;
                    case 'showAppliedOd':
                        useCaseFlows = intentShowAppliedOd;
                        break;
                    case 'companyDirectory':
                        useCaseFlows = intentCompanyDirectory;
                        break;
                    }
                    // useCaseFlows = notificationTest;
                    await dc.beginDialog('rootDialog', useCaseFlows);
                }

                await next();
            }
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;

            // Create  couple of mesaage formats to welcome the user for first time with Plain Text and Hero Card to send it across supported channels
            // Post which redirect the user to the dialog to start the conversation with login if he is not authenticated
            // const welcomeText = `Hello ${ context.activity.from.name } and Welcome to HonoBot`;
            for (const member of membersAdded) {
                console.log(member);
                if (member.id !== context.activity.recipient.id) {
                    const welcomeCardName = JSON.parse(JSON.stringify(welcomeCardjson));
                    welcomeCardName.body[0].items[0].columns[1].items[0].text = `Hey, ${ member.name },`;
                    var welcomeCard = MessageFactory.attachment(CardFactory.adaptiveCard(welcomeCardName));

                    await context.sendActivity(welcomeCard);
                }
            }
            // for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            //     if (membersAdded[cnt].id !== context.activity.recipient.id) {
            //         await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            //     }
            // }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    // addConversationReference(activity) {
    //     const conversationReference = TurnContext.getConversationReference(activity);
    //     this.conversationReferences[conversationReference.conversation.id] = conversationReference;
    // }

    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    async sendIntroCard(context) {
        const card = CardFactory.heroCard(
            'Welcome to Node JS Microsoft Bot Framework!',
            'This bot helps to handle multiple use cases based on dynamic json based configuration.',
            ['https://aka.ms/bf-welcome-card-image'],
            [{
                type: ActionTypes.OpenUrl,
                title: 'Get an overview',
                value: 'https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0'
            },
            {
                type: ActionTypes.OpenUrl,
                title: 'Ask a question',
                value: 'https://stackoverflow.com/questions/tagged/botframework'
            },
            {
                type: ActionTypes.OpenUrl,
                title: 'Learn how to deploy',
                value: 'https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-deploy-azure?view=azure-bot-service-4.0'
            }
            ]
        );

        await context.sendActivity({
            attachments: [card]
        });
    }

    async sendUpdateCard(context) {
        const data = context.activity.value;
        data.count += 1;
        // cardActions.push({
        //     type: ActionTypes.MessageBack,
        //     title: 'Update Card',
        //     value: data,
        //     text: 'UpdateCardAction'
        // });
        const card = CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.3',
            body: [{
                type: 'TextBlock',
                text: 'Please Wait..!',
                wrap: true
            }]
        });
        card.id = context.activity.replyToId;
        const message = MessageFactory.attachment(card);
        message.id = context.activity.replyToId;

        // Send the updated card as a reply to the original message
        await context.updateActivity(message);
    }
}

module.exports.MainBot = MainBot;
