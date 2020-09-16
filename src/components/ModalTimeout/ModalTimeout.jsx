// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import { ModalFace, ButtonFace } from '../../UxFaces';

const timeoutSec = 30;

class ModalTimeout extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        this.state = {
            visible: false, 
            sec: timeoutSec};

        this.intervalId = null;

        this.close = this.close.bind(this);
        this.closeClicked = this.closeClicked.bind(this);
        this.logoutActionHandler = this.logoutActionHandler.bind(this);
        this.intervalFunc = this.intervalFunc.bind(this);
    }

    show () {
        this.props.appObject.telemetry.track("Session timeout.warning");
        this.setState({visible: true, sec: timeoutSec}); 
        this.startTimer()
    }        
    
    closeClicked () {
        this.props.appObject.telemetry.track("Session timeout.canceled");
        this.close();
    }

    close () {
        this.setState({visible: false}); 
        this.stopTimer()
    }

    intervalFunc() {
        this.setState(state => ({sec: state.sec - 1}), 
            () => {if (this.state.sec < 0) {this.logoutActionHandler()}})
    }

    startTimer() {this.intervalId = window.setInterval(this.intervalFunc, 1000)}

    stopTimer() {if (this.intervalId) {window.clearInterval(this.intervalId)}}

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                closeButton={<ModalFace.Close onClick={this.closeClicked}/>}
                onClose={this.closeClicked}
            >
                <ModalFace.Header title="Automatic logout"/>
                <ModalFace.Body>
                    <div>
                        <p>We noticed that your session has been idle for some time.</p>
                        <p>{`You'll be logged out in ${this.state.sec} seconds unless we detect some activity.`}</p>
                    </div>
                </ModalFace.Body>
                <ModalFace.Footer>
                    <ButtonFace
                        kind="primary"
                        onClick={this.closeClicked}
                        size="large"
                        text="Stay logged in"
                    />
                    <ButtonFace
                        kind="tertiary"
                        onClick={this.logoutActionHandler}
                        size="large"
                        text="Logout"
                    />
                </ModalFace.Footer>
            </ModalFace>
        )
    }

    logoutActionHandler() {
        this.props.appObject.telemetry.track("Session timeout.auto-logoff");
        this.close(); 
        this.props.appObject.dsAuth.logout();
    }
}

export default ModalTimeout;
