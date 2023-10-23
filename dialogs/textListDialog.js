// this dialog is to show corousel dialog if supported by channel used by user else give simeple Text

// const { CardFactory } = require('botbuilder');
const { ActivityTypes } = require('botbuilder');
// Import AdaptiveCard content.
const ACData = require('adaptivecards-templating');
const lodash = require('lodash');
// const AdaptiveCards  = require("adaptivecards")

const { TextPrompt } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder');
const { StringExpression } = require('adaptive-expressions');

class TextListDialog extends TextPrompt {
    constructor(flow, services) {
        // global.currectDialogs = dialogs
        super(flow.objectId);
        this.dialog = flow;
        // console.log('o');
        // Implement your custom text dialog logic here
    }

    // create onPrompt method to override the default onPrompt method
    async beginDialog(innerDc, flowData) {
        console.log(2);
        // this if is for channels that support corousel
        var channel = 'Emulator'; // just for testing
        if (innerDc.user.channel === 'Emulator' || innerDc.user.channel === 'msteams' || channel === 'Emulator') {
            await this.createCarousel(innerDc, flowData);
        // eslint-disable-next-line brace-style
        }
        // if corousel is not supported then send plain text
        else {
            await this.sendTextToUser(innerDc, flowData);
        }
        return await innerDc.endDialog();
    }

    async continueDialog(innerDc) {
        console.log('textlist card continue');
        this.beginDialog(innerDc);
    }

    async createCarousel(innerDc, flowData) {
        var showCard = this.dialog.CardDesign;
        var apiData = flowData.dictionary.submit;
        // if(this.dialog.cardName == 'leaveBalance'){
        //     var showCard = leaveBalanceCard
        //     var apiData = innerDc.api_response
        // }

        const template = new ACData.Template(showCard);
        const card = template.expand({
            $root: apiData
        });

        console.log(card);

        const heroCards = [];
        // CardFactory.heroCard('Casual leave', '5'),
        // CardFactory.heroCard('Privelege leave', '10'),
        // CardFactory.heroCard('LWP', '0'),

        card.forEach(element => {
            heroCards.push(CardFactory.heroCard(element.title, element.subTitle, element.imageUrl));
        });

        console.log(heroCards);

        // Create an Activity with a Carousel of Hero Cards
        const carouselActivity = {
            type: ActivityTypes.Message,
            attachmentLayout: 'carousel',
            attachments: heroCards
        };

        // Send the carousel activity
        await innerDc.context.sendActivity(carouselActivity);
    }

    async sendTextToUser(innerDc, flowData) {
        const expCondition = new StringExpression(this.dialog.data);
        const apiResult = JSON.parse(expCondition.getValue(flowData.dictionary));
        // console.log(apiResult);
        // This is for dynamic Title
        // const expTitle = new StringExpression(this.dialog.title);
        // const titleResult = expTitle.getValue(flowData.dictionary);
        // var text = titleResult + '\n\n';
        var text = '';
        /// /////////////////////////
        apiResult.forEach(element => {
            text += '\n';
            for (var i = 0; i < this.dialog.validKeys.length; i++) {
                const key = this.dialog.validKeys[i];
                let value = lodash.get(element, key);
                if (value === undefined) {
                    value = 'None';
                }
                if (this.dialog.labelNames[i] === '') {
                    text += value + '\n';
                } else {
                    text += this.dialog.labelNames[i] + ' : ' + value + '\n';
                }

                console.log(key, value);

                text += '\n';
            }
            text += '---------------------------------';
        });

        /// ////////////////////////
        // apiResult.forEach(element => {
        //     Object.entries(element).forEach(([key, value]) => {
        //         if (this.dialog.validKeys.includes(key)) {
        //             text += '\n';

        //             // Split the key by underscores and capitalize the first letter of each word
        //             key = key.split('_').map((word, index) => {
        //                 if (index === 0) {
        //                     return word; // Keep the first word as is
        //                 } else {
        //                     return word.charAt(0).toUpperCase() + word.slice(1);
        //                 }
        //             });

        //             var camelCaseKey = key.join('');
        //             // capitalize 1st word of camelCaseKey
        //             camelCaseKey = camelCaseKey[0].toUpperCase() + camelCaseKey.slice(1);
        //             text += camelCaseKey + ' : ' + value + '\n';
        //         } else {
        //             console.log('in else');
        //         }
        //         console.log(key, value);
        //     });

        //     text += '\n';
        //     text += '---------------------------------';
        // });

        // console.log(text);

        await innerDc.context.sendActivity(text);
    }
}

module.exports.TextListDialog = TextListDialog;
