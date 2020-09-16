// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import { ModalFace, ButtonFace, FormUnitFace, TextBoxFace, 
         FileInputFace, FormFace } from '../../UxFaces';

class ModalOpenDiagram extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        this.dsFileMgr = this.props.appObject.dsFileMgr;
        this.state = {visible: false, 
            url: '' 
        };
        this.close = this.close.bind(this);
        this.openUrl = this.openUrl.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.qpUrl = this.qpUrl.bind(this);
    }

    show () {
        this.props.appObject.telemetry.track("Open Diagram.show");
        this.props.appObject.blocklySection.blocklyClearSelection();
        this.setState({visible: true})
    }

    close () {this.setState({visible: false})}
    
    /**
     * Open the diagram url supplied as the dgm query parameter to the tool
     * @param {string} dgmUrl The diagram url entered on the tool's URL  
     */
    async qpUrl(dgmUrl) {
        await this.dsFileMgr.openUrl(dgmUrl);
    }

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                closeButton={<ModalFace.Close onClick={this.close}/>}
                onClose={this.close}
            >
                <ModalFace.Header title="Open Diagram"/>
                <ModalFace.Body>
                    <div>
                        <p>
                            {this.props.oliveUx ? 
                                "You can open a diagram from a local file, or via a URL."
                                :
                                "Open a diagram from a local file"
                            }
                        </p>
                    </div>
                    <FormFace onSubmit={this.handleSubmit}>
                        <FormUnitFace>
                            <FileInputFace text="Open a file"
                                accept=".dgm"
                                onChange={evt => this.openFile(evt)}
                            />
                            {this.props.oliveUx ?
                                <div id="textButton">
                                    <TextBoxFace label="Open a URL" 
                                        value={this.state.url}
                                        onChange={evt => this.updateUrlValue(evt)}
                                        />
                                    <ButtonFace
                                        kind="primary"
                                        onClick={this.openUrl}
                                        size="medium"
                                        text="Open"
                                    />
                                </div>
                                : null
                            }
                        </FormUnitFace>
                    </FormFace>
                </ModalFace.Body>
                <ModalFace.Footer>
                    <ButtonFace
                        kind="tertiary"
                        onClick={this.close}
                        size="large"
                        text="Cancel"
                    />
                </ModalFace.Footer>
            </ModalFace>
        )
    }

    updateUrlValue(evt) {this.setState({url: evt.target.value})}
    
    async openFile(evt) {
        const fileObj = evt.target.files[0]
            , reader = new FileReader()
            , fileloaded = async evt => {
                await this.dsFileMgr.openDiagramFile(fileObj.name, evt.target.result);
                this.close();
              }
            ;
        this.props.appObject.telemetry.track("Open Diagram.open file", 
            {"Diagram open file": fileObj.name});
        reader.onload = fileloaded;
        reader.readAsText(fileObj);
    }

    async openUrl() {
        this.props.appObject.telemetry.track("Open Diagram.open url", 
            {"Diagram open url": this.state.url});
        this.setState({visible: false})
        await this.dsFileMgr.openUrl(this.state.url);
    }

    async handleSubmit (e) {
        e.preventDefault();
        await this.openUrl();
    }
}

export default ModalOpenDiagram;
