// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import { ModalFace, ButtonFace, FormUnitFace, 
         SelectFace, FormFace } from '../../UxFaces';

class ModalSdkSettings extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        this.state = {visible: false,
        };
        this.close = this.close.bind(this);
    }

    show () {this.setState({visible: true})}        
    close () {this.setState({visible: false})}        

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                closeButton={<ModalFace.Close onClick={this.close}/>}
                onClose={this.close}
            >
                <ModalFace.Header title="SDK Settings"/>
                <ModalFace.Body>
                    <div>
                        <p>To run the example SDK code on your computer,
                           download the example framework for the SDK.
                           Then copy the SDK code into the framework's example or index file.
                        </p>
                    </div>
                    <FormFace>
                        <FormUnitFace>
                            <SelectFace label="SDK Language" 
                                value={this.props.sdkLanguage}
                                onChange={evt => this.props.sdkLanguageOnChange(evt.target.value)}
                            >
                                {this.props.languages.map((lang, i) => (
                                    <SelectFace.Option 
                                        text={this.props.languageNames(lang)} 
                                        value={lang} key={`lang${i}`} />
                                ))}
                            </SelectFace>
                        </FormUnitFace>
                    </FormFace>
                </ModalFace.Body>
                <ModalFace.Footer>
                    <ButtonFace
                        kind="tertiary"
                        onClick={this.close}
                        size="large"
                        text="Close"
                    />
                </ModalFace.Footer>
            </ModalFace>
        )
    }
}

export default ModalSdkSettings;
