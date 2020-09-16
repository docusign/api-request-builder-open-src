// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import { ModalFace, ButtonFace, TableFace, FormFace} from '../../UxFaces';

const videos = [
    {title: "API Request Builder conference session",
     description: "A 20 minute conference presentation about the API Request Builder.",
     url: "https://youtu.be/G2q4PITAwyM"
    }
]

class ModalVideos extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        this.state = {
            visible: false,
        };
        this.close = this.close.bind(this);
        this.openVideo = this.openVideo.bind(this);
    }

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                closeButton={<ModalFace.Close onClick={this.close}/>}
                onClose={this.close}
            >
                <ModalFace.Header title="Videos"/>
                <ModalFace.Body>
                    <FormFace onSubmit={this.handleSubmit}>
                        <TableFace>
                            <TableFace.Header>
                                <TableFace.HeaderCell text="Title" />
                                <TableFace.HeaderCell text="View" />
                            </TableFace.Header>
                            <TableFace.Body>
                            {videos.map( (video, i) =>
                                <TableFace.Row key={`video${i}`} >
                                    <TableFace.Cell><b>{video.title}</b><br />{video.description}</TableFace.Cell>
                                    <TableFace.Cell>
                                        <ButtonFace
                                            kind="primary"
                                            onClick={this.openVideo}
                                            size="small"
                                            text="View"
                                            data-url={video.url}
                                        />
                                    </TableFace.Cell>
                                </TableFace.Row>
                            )}
                            </TableFace.Body>
                        </TableFace>
                    </FormFace>
                </ModalFace.Body>
                <ModalFace.Footer>
                    <ButtonFace
                        kind="secondary"
                        onClick={this.close}
                        size="large"
                        text="Close"
                    />
                </ModalFace.Footer>
            </ModalFace>
        )
    }

    show () {
        this.props.appObject.blocklySection.blocklyClearSelection();
        this.setState({visible: true});
        this.props.appObject.telemetry.track("Videos.show");
    }        
    close () {this.setState({visible: false})}      
    handleSubmit (e) {e.preventDefault()}
    async openVideo(e) {
        const url = e.target.getAttribute('data-url')
            , title = videos.find(value => value.url === url).title;
        this.setState({visible: false})
        this.props.appObject.telemetry.track("Videos.open", 
            {"View video": title}, false);
        window.open(url, "_blank");
    }
}

export default ModalVideos;
