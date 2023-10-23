const expressions = require('../../utils/expressions');
var { CardFactory, MessageFactory, AttachmentTypes } = require('botbuilder');
const ACData = require('adaptivecards-templating');

async function getRandomReply(module, intent, language, AuthenticationDetails) {
    var user_details = AuthenticationDetails;

    var module = module.toLowerCase();
    var textIntent = intent.toLowerCase();
    var textLanguage = language.toLowerCase();
    var replyJsonPath = `./${ textLanguage }/${ module }.json`;
    var replyJson = require(replyJsonPath);
    // console.log(`++++${replyJsonPath}++++++++>`,replyJson)
    switch (textIntent) {
    case 'help':
        const helpMessage = 'How can I assist you?';
        var card = {
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.3',
            body: [
                {
                    type: 'TextBlock',
                    text: helpMessage,
                    size: 'large',
                    weight: 'bolder'
                },
                {
                    type: 'ActionSet',
                    actions: [
                    ],
                    style: 'positive'
                }
            ]
        };
        var data = replyJson[textIntent];
        for (let i = 0; i < data.length; i++) {
            // console.log(myList[i]);
            var originalString = `{
                    "type": "Action.Submit",
                    "title": "${ data[i] }",
                    "data": {"type":"${ data[i] }"}
                    }`;
                // console.log("========",originalString)
            var jsonTemplate = JSON.parse(originalString);
            card.body[1].actions.push(jsonTemplate);
        }
        console.log(card.body[1].actions);
        var card2 = CardFactory.adaptiveCard(card);
        const message = MessageFactory.attachment(card2);

        return message;
    default:
        if (replyJson[textIntent]) {
            // console.log('list of replies',replyJson[textIntent])
            var randomIndex = Math.floor(Math.random() * replyJson[textIntent].length);
            var rendomReplyText = replyJson[textIntent][randomIndex];
            // console.log(randomIndex,'--Reply Raw text ->',rendomReplyText)
            const new_expression = new expressions();
            var finalText = await new_expression.StringExpressionJson(rendomReplyText, user_details.senderData.info);
            console.log('********final reply Text **********', finalText);

            return finalText;
        }
    }
}
// async function getRandomKey(dict) {
//     const value = Object.values(dict);
//     const randomIndex = Math.floor(Math.random() * value[0].length);
//     return value[0][randomIndex];
// }
async function getCurrentTimeZoneGreeting(timeZone) {
    const now = new Date();
    const currentDateTime = new Date(now.toLocaleString('en-US', { timeZone }));
    const hour = currentDateTime.getHours();
    if (hour >= 1 && hour < 12) {
        return 'Good Morning!';
    } else if (hour >= 12 && hour < 17) {
        return 'Good Afternoon!';
    } else {
        return 'Good Evening!';
    }
}

module.exports = { getRandomReply, getCurrentTimeZoneGreeting };
