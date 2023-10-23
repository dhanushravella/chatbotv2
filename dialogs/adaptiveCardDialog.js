// const { CardFactory } = require('botbuilder');
// Import AdaptiveCard content.
const myProfileCard = require('../resources/myProfile.json');
const calendarCard = require('../resources/calendar.json');
const ACData = require('adaptivecards-templating');
// const AdaptiveCards  = require("adaptivecards")
const Expressions = require('../utils/expressions');

const { TextPrompt } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder');

class AdaptiveCardDialog extends TextPrompt {
    constructor(flow, services) {
        super(flow.objectId);
        this.dialog = flow;
    }

    // create onPrompt method to override the default onPrompt method
    async beginDialog(innerDc) {
        // console.log('-->',innerDc);
        await this.sendTextToUser(innerDc);
        return await innerDc.endDialog();
    }

    async continueDialog(innerDc) {
        console.log('adaptive card continue');
        this.beginDialog(innerDc);
    }

    async createCalendar(innerDc) {
        console.log('in create calendar!!');

        const numberOfBoxes = innerDc.api_response.show_calendar.length;
        var body = [];
        var columnSet = {};
        var columns = [];

        var idx = 0;
        var startIdx = 0;
        var fillDateIdx = 0;
        // starting date of month corresponding to day eg: 1st of any month is on which day(mon,tues etc)
        var startingDay = innerDc.api_response.show_calendar[0].formattedDate.split(',')[0];

        for (var j = 0; j <= calendarCard.body[1].columns.length; j++) {
            console.log(calendarCard.body[1].columns[j].items[0].id);
            console.log(startingDay);
            if (calendarCard.body[1].columns[j].items[0].id === startingDay) {
                // console.log('--->: ',calendarCard.body[1].columns[j]['items'][0]['id']);
                // console.log('--->: ',startingDay);
                break;
            }
            startIdx += 1;
        }

        while (true) {
            if (idx !== 0 && idx % 7 === 0) {
                // this is one column set
                columnSet.type = 'ColumnSet';
                columnSet.columns = columns;
                // push columnset to body
                body.push(columnSet);
                columnSet = {};
                columns = [];
            }

            // breaking condition 35 because it will create 35 dateboxes and fill data according to data in api
            if (idx === 35) {
                console.log('yoooooooo');
                break;
            }

            // these dateboxes will display value from api
            if (idx >= startIdx && fillDateIdx < numberOfBoxes) {
                // get dd from the given date in api
                const dateDay = innerDc.api_response.show_calendar[fillDateIdx].start.split('-').slice(-1);
                console.log(dateDay);
                // make date boxes
                var AttendanceStatus = innerDc.api_response.show_calendar[fillDateIdx].status;
                console.log(AttendanceStatus);
                var color = '';
                // var textWeight = '';
                // var size = '';
                if (AttendanceStatus === 'Absent') {
                    color = 'attention';
                    // textWeight = "bolder"
                    // size = "medium"
                } else if (AttendanceStatus === 'Present') {
                    color = 'good';
                    // textWeight = "bolder"
                    // size = "medium"
                // } else if (AttendanceStatus === "Weekly Off" || AttendanceStatus === "Holiday") {
                //     color = "emphasis";
                } else if (AttendanceStatus.includes('Leave')) {
                    color = 'accent';
                    // textWeight = "bolder"
                    // size = "medium"
                } else {
                    color = 'emphasis';
                }

                var dateBox = {
                    type: 'Column',
                    width: 'stretch',
                    items: [
                        {
                            type: 'TextBlock',
                            text: dateDay.toString(),
                            wrap: true,
                            // "color": color,
                            size: 'medium'
                        }
                    ],
                    style: color
                };
                fillDateIdx += 1;
            // eslint-disable-next-line brace-style
            }
            // keep value blank, these will be blank dateboxes
            else {
                dateBox = {
                    type: 'Column',
                    width: 'stretch',
                    items: [
                        {
                            type: 'TextBlock',
                            text: '',
                            wrap: true,
                            color: 'Good'
                        }
                    ]
                };
            }

            // push each bot to column
            columns.push(dateBox);
            idx += 1;
        }

        return body;
    }

    async sendTextToUser(innerDc) {
        console.log('hellllllllllllllllllll========>>>>>>>>>>>>>>.llllllllllllllllllloooo');
        const newExpression = new Expressions();
        if (this.dialog.cardName === 'myProfile') {
            var userDOB = innerDc.api_response.personal_data.DOB;
            const dateFormat = 'MM/dd/yyyy';
            innerDc.api_response.personal_data.DOB = await newExpression.dateformater(userDOB, dateFormat);
            var data = { cardName: this.dialog.cardName === 'myProfile', api_response: innerDc.api_response };
            const template = new ACData.Template(myProfileCard);
            var card = template.expand({
                $root: data.api_response.personal_data
            });
        }
        if (this.dialog.cardName === 'calendar') {
            var calendarBody = await this.createCalendar(innerDc);
            const template = new ACData.Template(calendarCard);
            card = template.expand({
                $root: calendarBody
            });
            // var card = CardFactory.adaptiveCard({
            //         $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            //         type: 'AdaptiveCard',
            //         body: calendarBody,
            //         version: '1.3',
            //     });
            // card = calendarCard
        }

        await innerDc.context.sendActivity({
            attachments: [CardFactory.adaptiveCard(card)]
        });
    }
}

module.exports.AdaptiveCardDialog = AdaptiveCardDialog;
