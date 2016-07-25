'use strict';

function AlexaSkill(appId) {
    this._appId = appId;
}

AlexaSkill.speechOutputType = {
    PLAIN_TEXT: 'PlainText',
    SSML: 'SSML'
}

//event.request.type triggers the below methods.
AlexaSkill.prototype.requestHandlers = {
    LaunchRequest: function (event, context, response) {
        this.eventHandlers.onLaunch.call(this, event.request, event.session, response);
    },

    IntentRequest: function (event, context, response) {
        this.eventHandlers.onIntent.call(this, event.request, event.session, response);
    },

    SessionEndedRequest: function (event, context) {
        this.eventHandlers.onSessionEnded(event.request, event.session);
        context.succeed();
    }
};

//Override any of the eventHandlers as needed.
//Called by the different requestHandlers.
AlexaSkill.prototype.eventHandlers = {

    //Called when the session starts.
    //Subclasses could have overriden this function to open any necessary resources.    
    onSessionStarted: function (sessionStartedRequest, session) {
    },

    //Called when the user invokes the skill without specifying what they want.
    //Request type LaunchRequest triggers this method.
    //The subclass must override this function and provide feedback to the user.
    onLaunch: function (launchRequest, session, response) {
        throw "onLaunch should be overriden by subclass";
    },

    //Called request type of IntentRequest is sent through.
    onIntent: function (intentRequest, session, response) {
        var intent = intentRequest.intent;
        var intentName = intentRequest.intent.name;
        var intentHandler = this.intentHandlers[intentName];
        //response.ask('before dispatching to intent type');   
        //Supported Intent Types Are:
        //GroceryListIntent
        //AMAZON.HelpIntent
        if (intentHandler) {
            console.log('dispatch intent = ' + intentName);
            intentHandler.call(this, intent, session, response);
        } else {
            throw 'Unsupported intent = ' + intentName;
        }
    },

    
    //Called when the user ends the session.
    //Subclasses could have overriden this function to close any open resources.
    onSessionEnded: function (sessionEndedRequest, session) {
    }
};


//Subclasses should override the intentHandlers with the functions to handle specific intents.
AlexaSkill.prototype.intentHandlers = {};

//Execute is called on bootstrap.
AlexaSkill.prototype.execute = function (event, context) {
    try {
        console.log("session applicationId: " + event.session.application.applicationId);

        // Validate that this request originated from authorized source.
        if (this._appId && event.session.application.applicationId !== this._appId) {
            console.log("The applicationIds don't match : " + event.session.application.applicationId + " and "
                + this._appId);
            throw "Invalid applicationId";
        }

        //check for attributes and set to empty {} if none exist.
        if (!event.session.attributes) {
            event.session.attributes = {};
        }

        if (event.session.new) {
            //Open any necessary resources.
            this.eventHandlers.onSessionStarted(event.request, event.session);
        }

        //Route the request to the proper handler which may have been overriden.
        var requestHandler = this.requestHandlers[event.request.type];
        requestHandler.call(this, event, context, new Response(context, event.session));
    } catch (error) {
        //This error will trigger in event object doesnt have expected properties or if Alexa
        //cannot call the requestHandler.
        console.log("Unexpected exception " + error);
        context.fail(error);
    }
};

//Constructor for AlexaSkill responses.
var Response = function (context, session) {
    this._context = context;
    this._session = session;
};

//Create speech object that tells Alexa what to say.
function createSpeechObject(optionsParam) {
    if (optionsParam && optionsParam.type === 'SSML') {
        return {
            type: optionsParam.type,
            ssml: optionsParam.speech
        };
    } else {
        return {
            type: optionsParam.type || 'PlainText',
            text: optionsParam.speech || optionsParam
        }
    }
}

//Build the reponse object sent to Alexa.
Response.prototype = (function () {
    var buildSpeechletResponse = function (options) {
        var alexaResponse = {
            outputSpeech: createSpeechObject(options.output),
            shouldEndSession: options.shouldEndSession
        };
        if (options.reprompt) {
            alexaResponse.reprompt = {
                outputSpeech: createSpeechObject(options.reprompt)
            };
        }
        if (options.cardTitle && options.cardContent) {
            alexaResponse.card = {
                type: "Simple",
                title: options.cardTitle,
                content: options.cardContent
            };
        }
        var returnResult = {
                version: '1.0',
                response: alexaResponse
        };
        if (options.session && options.session.attributes) {
            returnResult.sessionAttributes = options.session.attributes;
        }
        return returnResult;
    };
    //Setting methods available on response prototype
    //Are these expected by Alexa?
    return {
        tell: function (speechOutput) {
            this._context.succeed(buildSpeechletResponse({
                session: this._session,
                output: speechOutput,
                shouldEndSession: true
            }));
        },
        tellWithCard: function (speechOutput, cardTitle, cardContent) {
            //tellWithCard is for visuals using Amazon Echo App.
            this._context.succeed(buildSpeechletResponse({
                session: this._session,
                output: speechOutput,
                cardTitle: cardTitle,
                cardContent: cardContent,
                shouldEndSession: true
            }));
        },
        ask: function (speechOutput, repromptSpeech) {
            this._context.succeed(buildSpeechletResponse({
                session: this._session,
                output: speechOutput,
                reprompt: repromptSpeech,
                shouldEndSession: false
            }));
        },
        askWithCard: function (speechOutput, repromptSpeech, cardTitle, cardContent) {
            //askWithCard is for visuals using Amazon Echo App.            
            this._context.succeed(buildSpeechletResponse({
                session: this._session,
                output: speechOutput,
                reprompt: repromptSpeech,
                cardTitle: cardTitle,
                cardContent: cardContent,
                shouldEndSession: false
            }));
        }
    };
})();

module.exports = AlexaSkill;
