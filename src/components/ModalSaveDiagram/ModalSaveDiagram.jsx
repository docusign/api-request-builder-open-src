// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import { ModalFace, ButtonFace, FormUnitFace, TextBoxFace, 
         TextAreaFace, FormFace } from '../../UxFaces';

class ModalSaveDiagram extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        this.dsFileMgr = this.props.appObject.dsFileMgr;
        this.state = {visible: false, objectUrl: "", 
            title: this.dsFileMgr.title, 
            category: this.dsFileMgr.category, 
            description: this.dsFileMgr.description,
            instructions: this.dsFileMgr.instructions
        };
        this.close = this.close.bind(this);
        this.saveDiagram = this.saveDiagram.bind(this)
    }

    show () {
        this.props.appObject.blocklySection.blocklyClearSelection();
        this.setState({visible: true});
        this.props.appObject.telemetry.track("Save Diagram.show");
    }        
    close () {this.setState({visible: false})}        

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                closeButton={<ModalFace.Close onClick={this.close}/>}
                onClose={this.close}
            >
                <ModalFace.Header title="Save Diagram"/>
                <ModalFace.Body>
                    <div>
                        <p>Note: Do not share your diagram if it includes private information 
                           (email addresses, names, etc.)
                        </p>
                    </div>
                    <FormFace>
                        <FormUnitFace>
                            <TextBoxFace label="Diagram Title" 
                                value={this.state.title}
                                onChange={evt => this.updateTitleValue(evt)}/>
                            <TextBoxFace label="Category" 
                                value={this.state.category}
                                onChange={evt => this.updateCategoryValue(evt)}/>
                            <TextAreaFace label="Description"
                                value={this.state.description} 
                                onChange={evt => this.updateDescriptionValue(evt) }/>
                            <TextAreaFace label="Instructions"
                                value={this.state.instructions} 
                                onChange={evt => this.updateInstructionsValue(evt) }/>

                            <a className="hidden" target="_blank" href={this.state.objectUrl}
                                rel="noopener noreferrer"
                                download="API Request Builder.dgm" ref={e=>this.downloadA = e}>download file</a>
                        </FormUnitFace>
                    </FormFace>
                </ModalFace.Body>
                <ModalFace.Footer>
                    <ButtonFace
                        kind="primary"
                        onClick={this.saveDiagram}
                        size="large"
                        text="Save Diagram"
                    />
                    <ButtonFace
                        kind="secondary"
                        onClick={this.close}
                        size="large"
                        text="Cancel"
                    />
                </ModalFace.Footer>
            </ModalFace>
        )
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.visible && !prevState.visible) {
            this.setState({
                title: this.dsFileMgr.title, 
                category: this.dsFileMgr.category, 
                description: this.dsFileMgr.description    
            })
        }
    }

    updateTitleValue(evt) {this.dsFileMgr.description = evt.target.value; this.setState({title: evt.target.value})}
    updateCategoryValue(evt) {this.dsFileMgr.description = evt.target.value; this.setState({category: evt.target.value})}
    updateDescriptionValue(evt) {this.dsFileMgr.description = evt.target.value; this.setState({description: evt.target.value})}
    updateInstructionsValue(evt) {this.dsFileMgr.instructions = evt.target.value; this.setState({instructions: evt.target.value})}

    async saveDiagram() {
        const title = this.state.title
            , category = this.state.category
            , description = this.state.description
            , instructions = this.state.instructions
            , blob = await this.dsFileMgr.getDownloadBlob (title, category, description, instructions)
            , objectUrl = URL.createObjectURL(blob)
            ;
        this.setState ({objectUrl: objectUrl}, () => {
            this.downloadA.click(); 
            URL.revokeObjectURL(objectUrl);  // free up storage--no longer needed.
            this.setState({visible: false, objectUrl: ""});
            this.props.appObject.blocklySection.downloadedDiagram();
        })
        this.props.appObject.telemetry.track("Save Diagram.save");
    }
}

export default ModalSaveDiagram;
