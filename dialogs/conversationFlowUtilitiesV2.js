const { HeroCard, CardAction, CardFactory, ActionTypes } = require('botbuilder');
const { StringExpression } = require('adaptive-expressions');
const { Json } = require('adaptive-expressions/lib/builtinFunctions');
const expressions = require('../utils/expressions');
// const { JArray, JObject } = require('Newtonsoft.Json.Linq');
// const regex = require('regex'); // Replace 'regex-package' with the actual regex package you are using

class ConversationFlowUtilitiesV2 {
    createCarousel(currentFlow, cards, flowData, choices, channel, context, results) {
        const result = [];

        if (!cards || cards.length === 0) {
            return null;
        }

        if (cards) {
            console.log(results);
            for (var i = 0; i < results.choices.length; i++) {
                result.push(CardFactory.heroCard(
                    results.choices[i].value, // title keep empty
                    CardFactory.images(['']), // image keep empty
                    // buttons to be added
                    CardFactory.actions([
                        {
                            type: ActionTypes.ImBack,
                            title: 'Choose',
                            value: results.choices[i].value
                        }
                    ])));
            }
            // results.choices.forEach(element => {

            // });
            // result.push(CardFactory.heroCard('Card 1 Title', 'Subtitle 1'));
            return result;
        } else {

        }
    }

    resolveCards2(data, cards, flowData, choices, channel, context) {
        choices = [];
        const result = [];

        if (!cards || cards.length === 0) {
            return null;
        }

        if (data) {
            data = JSON.stringify(data);
            const ep = new StringExpression(data);
            const jarray = JSON.parse(ep.getValue(flowData));

            // if (error) {
            //     throw new Error(error);
            // }

            // if (!(jarray instanceof JArray)) {
            //     throw new Error("data is not an array");
            // }

            let i = 1;
            for (const parsedObject of jarray) {
                for (const card of cards) {
                    let text = card.Text ? card.Text : '';

                    if (flowData.Channel !== 'msteams') {
                        text = text.replace('<b>', '**').replace('</b>', '**');
                    }

                    const title = card.Title ? card.Title : '';
                    const subTitle = card.Subtitle ? card.Subtitle : '';

                    const heroCard = CardFactory.heroCard({
                        title,
                        subTitle
                    });

                    if (card.Buttons) {
                        heroCard.buttons = [];

                        // if (card.Buttons instanceof jarray) {
                        //     const buttonList = card.Buttons;
                        //     if (buttonList && buttonList.length > 0) {
                        //         let j = 1;
                        //         for (const item of buttonList) {
                        //             const button = new StringExpression(item);
                        //             const buttonValue = button.getValue(parsedObject);

                        //             if (buttonValue) {
                        //                 heroCard.buttons.push(new CardAction({
                        //                     title: buttonValue,
                        //                     value: `${i}.${j}`,
                        //                     type: ActionTypes.ImBack
                        //                 }));
                        //             }
                        //             j++;
                        //         }
                        //     }
                        // } else {
                        const button = new StringExpression(JSON.stringify(card.Buttons));
                        const buttonValue = button.getValue(parsedObject);
                        const cardActions = [{
                            type: 'imBack',
                            title: buttonValue,
                            value: i.toString()
                        }];
                        if (buttonValue) {
                            // heroCard.buttons.push(undefined)
                            heroCard.buttons.push(cardActions);
                        }
                        // }
                    }

                    result.push(heroCard);

                    choices.push({
                        value: i.toString()
                    });

                    i++;
                }
            }
        } else {
            let i = 1;
            for (const card of cards) {
                const text = card.Text ? card.Text.getValue(flowData) : '';
                const title = card.Title ? card.Title.getValue(flowData) : '';

                const heroCard = new HeroCard({
                    title: title,
                    text: text
                });

                if (card.Buttons) {
                    heroCard.buttons = [];

                    if (card.Buttons instanceof JArray) {
                        const buttonList = card.Buttons;
                        if (buttonList && buttonList.length > 0) {
                            let j = 1;
                            for (const item of buttonList) {
                                const button = new StringExpression(item);
                                const buttonValue = button.getValue(flowData);

                                if (buttonValue) {
                                    heroCard.buttons.push(new CardAction({
                                        title: buttonValue,
                                        value: `${ i }.${ j }`,
                                        type: ActionTypes.ImBack
                                    }));
                                }
                                j++;
                            }
                        }
                    } else {
                        const button = new StringExpression(card.Buttons);
                        const buttonValue = button.getValue(flowData);

                        if (buttonValue) {
                            heroCard.buttons.push(new CardAction({
                                title: buttonValue,
                                value: i.toString(),
                                type: ActionTypes.ImBack
                            }));
                        }
                    }
                }

                result.push(heroCard);

                choices.push({
                    value: i.toString()
                });

                i++;
            }
        }

        return result;
    }

    resolveMenu3(data, options, flowData, choices, localizationUtilities = null) {
        choices = [];
        const result = [];

        if (!options || options.length === 0) {
            return null;
        }

        if (data) {
            data = JSON.stringify(data);
            const ep = new StringExpression(data);
            const jarray = JSON.parse(ep.getValue(flowData));

            // if (error) {
            //     throw new Error(error);
            // }

            // if (!(jarray instanceof JArray)) {
            //     throw new Error("data is not an array");
            // }

            for (const option of options) {
                const regex = /\$\{([^{}]+)\}*/g;
                const matches = [...option.answer.matchAll(regex)];

                if (matches && matches.length > 0) {
                    for (const parsedObject of jarray) {
                        const answer = new StringExpression(option.answer);
                        const format = answer.getValue(parsedObject);

                        choices.push({
                            value: format
                        });

                        if (format === option.answer) {
                            result.push({
                                nextQuestion: option.nextQuestion,
                                answer: format,
                                Validation: format
                            });
                        } else {
                            result.push({
                                nextQuestion: option.nextQuestion,
                                answer: format,
                                Validation: parsedObject
                            });
                        }
                    }
                } else {
                    choices.push({
                        value: option.answer
                    });

                    result.push({
                        nextQuestion: option.nextQuestion,
                        answer: option.answer,
                        Validation: option.Validation || option.answer
                    });
                }
            }
        } else {
            for (const option of options) {
                const answer = new StringExpression(option.answer);
                let answerFormat = null;

                if (localizationUtilities) {
                    const keyVal = answer.getValue(flowData);
                    const module = localizationUtilities.getModule(keyVal);

                    if (flowData.user && module) {
                        const user = flowData.user;
                        const question = new StringExpression(localizationUtilities.getQuestion(module, keyVal, user.LanguageCode));
                        const text = question.getValue(data);

                        answerFormat = text;
                    }
                }

                answerFormat = answerFormat || answer.getValue(flowData);

                const validationText = option.Validation ? option.Validation.toString() : option.answer;
                const validation = new StringExpression(validationText);
                const validationFormat = validation.getValue(flowData);

                result.push({
                    nextQuestion: option.nextQuestion,
                    answer: answerFormat,
                    Validation: validationFormat
                });

                choices.push({
                    value: answerFormat
                });
            }
        }

        const finalResult = { latestOptions: result, choices: choices };

        return finalResult;
    }
}

module.exports.ConversationFlowUtilitiesV2 = ConversationFlowUtilitiesV2;
