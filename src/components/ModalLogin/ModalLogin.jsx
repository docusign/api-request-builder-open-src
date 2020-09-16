// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import { ModalFace, ButtonFace } from '../../UxFaces';
//import { thisTypeAnnotation } from '@babel/types';

class ModalLogin extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        this.state = {visible: false, msg: null};
        this.close = this.close.bind(this);
        this.loginActionHandler = this.loginActionHandler.bind(this);
    }

    show (msg) {
        this.props.appObject.blocklySection.blocklyClearSelection();
        this.setState({visible: true, msg: msg})
    }        
    close () {this.setState({visible: false})}        

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                closeButton={<ModalFace.Close onClick={this.loginActionHandler}/>}
                onClose={this.loginActionHandler}
            >
                <ModalFace.Header title="Please login"/>
                <ModalFace.Body>
                    <div>
                        {this.state.msg ? 
                        <p>{this.state.msg}</p> :
                        <>
                        <p>Please login using your developer demo account.</p>
                        <p className="topmargin">Don't have a developer demo account? Get 
                            a <a rel="noopener noreferrer" target="_blank" href="https://go.docusign.com/o/sandbox/">free account!</a></p>
                        </>
                        }
                    </div>
                </ModalFace.Body>
                <ModalFace.Footer>
                    <ButtonFace
                        kind="primary"
                        onClick={this.loginActionHandler}
                        size="large"
                        text="Login"
                    />
                </ModalFace.Footer>
            </ModalFace>
        )
    }

    loginActionHandler() {this.close(); this.props.dsAuth.startLogin()}
}

export default ModalLogin;
