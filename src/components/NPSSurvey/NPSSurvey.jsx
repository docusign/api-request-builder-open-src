// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import NPSInput from '../NPSInput';
import { ButtonFace, TextBoxFace, FormFace } from '../../UxFaces';

const goodSendsBeforeSurvey = 2
    , badSendsBeforeSurvey = 4
    , sendsUntilRetry = 5  // If dismissed, how many sends and days until next survey
    , daysUntilRetry = 14
    , totalRetries = 3
    , npsSurveyKey = 'npsSurvey'
    ;

class NPSSurvey extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        const oldState = this.getState()
        this.state = {
            showPart2: false,
            showSurvey: false,
            goodSends: oldState.goodSends || 0,
            badSends: oldState.badSends || 0,
            score: oldState.score || null, // A score indicates that the person responded.
            retryNumber: oldState.retryNumber || 0,
            lastTrySec: oldState.lastTrySec || null,
            comment: '',
            lastSend: ''
            };
        
        this.npsOnSubmit = this.npsOnSubmit.bind(this);
        this.npsOnDismiss = this.npsOnDismiss.bind(this);
        this.onDismissPart2 = this.onDismissPart2.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.send = this.send.bind(this);
        this.updateComment = this.updateComment.bind(this);
    }

    debugShowSurvey () {
        this.setState({showSurvey: true, score: null});
        this.props.appObject.telemetry.track("NPS.show survey", {"NPS last send": "test"})
    }

    goodSend () {
        // Successfully sent an envelope
        this.setState (state => {
            const newSends = state.goodSends + 1
                , showSurvey = this.startSurvey(newSends, state.badSends)
                , newRetryNumber = showSurvey ? state.retryNumber + 1 : state.retryNumber
                , newLastTrySec = showSurvey ? Math.floor(Date.now() / 1000) : state.lastTrySec
                ;
            if (showSurvey) {this.props.appObject.telemetry.track("NPS.show survey", 
                {"NPS last send": "good"})}
            return {goodSends: newSends, showSurvey: showSurvey, score: null, comment: "",
                retryNumber: newRetryNumber, lastTrySec: newLastTrySec, lastSend: "good"}
        }, this.saveState)
    }

    badSend () {
        // Unsuccessfully tried to send an envelope
        this.setState (state => {
            const newBadSends = state.badSends + 1
                , showSurvey = this.startSurvey(state.goodSends, newBadSends)
                , newRetryNumber = showSurvey ? state.retryNumber + 1 : state.retryNumber
                , newLastTrySec = showSurvey ? Math.floor(Date.now() / 1000) : state.lastTrySec
                ;
            if (showSurvey) {this.props.appObject.telemetry.track("NPS.show survey", 
                {"NPS last send": "bad"})}
            return {badSends: newBadSends, showSurvey: showSurvey, score: null, comment: "",
                retryNumber: newRetryNumber, lastTrySec: newLastTrySec, lastSend: "bad"}
        }, this.saveState)
    }

    startSurvey (goodSends, badSends) {
        // Don't do surveys for the open source version
        if (! this.props.oliveUx) {return false}

        const currentSec = Math.floor(Date.now() / 1000)
            , daysSinceLastRetry = this.state.lastTrySec ? 
                Math.floor((currentSec - this.state.lastTrySec) / (60 * 60 * 24)) : 0
            , showSurvey = (this.state.score === null) && 
                (this.state.retryNumber < (totalRetries + 1)) &&
                (
                    (this.state.retryNumber === 0 && goodSends >= goodSendsBeforeSurvey) ||
                    (this.state.retryNumber === 0 && badSends  >= badSendsBeforeSurvey ) ||
                    (this.state.retryNumber > 0 && 
                        daysSinceLastRetry >= daysUntilRetry && 
                        (  goodSends >= (goodSendsBeforeSurvey + this.state.retryNumber*sendsUntilRetry) 
                        ||  badSends >= (badSendsBeforeSurvey  + this.state.retryNumber*sendsUntilRetry)
                        )
                    )
                )
            ;
        return showSurvey
    }

    getState () {
        return this.props.appObject.getItem(npsSurveyKey) || {}
    }
    saveState () {
        this.props.appObject.setItem(npsSurveyKey, this.state);
    }

    render () {
        return (
            <>
            {this.state.showSurvey ? 
                <NPSInput onSubmit={this.npsOnSubmit} 
                onDismissed={this.npsOnDismiss}
                service="the API Request Builder"
            />: undefined
            }
            {this.state.showPart2 ?
                <div className='NPSInput'>
                    <ButtonFace className="NPSInput-Close"
                                text="x" 
                                onClick={this.onDismissPart2} 
                    />
                    <div className="NPSInput-Inner">
                        <p className="NPSInput-Message">
                            {this.state.score < 9 ? 
                            'Thank you for your feedback. How can we improve the tool for you?'
                            : 'Thank you! What do you like best about the tool?'}
                        </p>
                        <FormFace id="npsSurvey" onSubmit={this.handleSubmit}>
                            <TextBoxFace
                                label=''
                                value={this.state.comment}
                                onChange={evt => this.updateComment(evt)}
                            />
                            <ButtonFace
                                    kind="primary"
                                    onClick={this.send}
                                    size="large"
                                    text="Send"
                            />
                        </FormFace>
                    </div>
                </div>
            : undefined}
            </>
        )
    }
    
    // Form's submit handler
    async handleSubmit (e) {e.preventDefault(); await this.send()}
    // On part2 form, user clicked send
    async send() {
        this.setState({showPart2: false}); 
        this.sendMsg()
    }
    // Update the comment text field
    updateComment(evt) {this.setState({comment: evt.target.value})}
    // On page 1, user clicked a survey value. 
    // DON'T store at this point. Instead store after part 2
    npsOnSubmit(args) {
        this.setState({score: args.score, showSurvey: false, showPart2: true})
    } 
    // On page 1, user dismissed the survey
    async npsOnDismiss() {
        this.setState({showSurvey: false, showPart2: false});
        this.sendMsg();
    }
    // On page 2, user dismissed the part 2 FormFace. But they (already) rated the tool
    async onDismissPart2() {
        this.setState({showPart2: false});
        this.sendMsg();
    }
    // Send NPS message to back end
    sendMsg() {
        if (this.state.score) {
            this.props.appObject.telemetry.track("NPS.response", 
                {"NPS score": this.state.score, "NPS comment": this.state.comment})
        } else {
            this.props.appObject.telemetry.track("NPS.decline", 
            {"NPS score": null, "NPS comment": null})
        } 
        this.saveState()
    }
}

export default NPSSurvey;