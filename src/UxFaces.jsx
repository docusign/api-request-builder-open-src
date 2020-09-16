// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Overlay from 'react-bootstrap/Overlay';
import Tooltip from 'react-bootstrap/Tooltip';
import Spinner from 'react-bootstrap/Spinner';

// curl https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css > bootstrap.min.css
import './bootstrap.min.css';

class OliveUx {
    oliveUx() {return false}
}

class RootEl extends React.Component {
    render () {return (<>{this.props.children}</>)}
};

const ModalFace = class ModalClass extends React.Component {
    render () {
        return (
            <Modal show={this.props.visible} onHide={this.props.onClose}
                size={this.props.width === "xlarge" ? "xl" : "md"}>
                {this.props.children}
            </Modal>
    )}
};

ModalFace.Header = class ModalHeader extends React.Component {
    render () {
        return (
            <Modal.Header closeButton>
                <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
    )}
};

ModalFace.Close = class ModalClose extends React.Component {
    render () {return null}
};

ModalFace.Portal = class Portal extends React.Component {
    render () {return (<>{this.props.children}</>)}
};

ModalFace.Body = class Body extends React.Component {
    render () {return (<Modal.Body>{this.props.children}</Modal.Body>)}
};

ModalFace.Footer = class Footer extends React.Component {
    render () {return (<Modal.Footer>{this.props.children}</Modal.Footer>)}
};

class FooterFace extends React.Component {
    render () {return null}
};

class HeaderFace extends React.Component {
    render () {return null}
};

class ButtonFace extends React.Component {
    render () {

        return (
            <Button 
                {...this.props}
                variant={this.props.kind} 
                size={this.props.size === "small" ? "sm" : "lg"}>
                {this.props.text}
            </Button>
    )}
};

const TableFace = class TableClass extends React.Component {
    render () {return (
        <Table {...this.props}>{this.props.children}</Table>)}
};

TableFace.Header = class TableHeader extends React.Component {
    render () {return (
        <thead><tr>{this.props.children}</tr></thead>)}
};

TableFace.HeaderCell = class TableHeaderCell extends React.Component {
    render () {return (
        <th>{this.props.text}</th>)}
};

TableFace.Body = class TableBody extends React.Component {
    render () {return (
        <tbody>{this.props.children}</tbody>)}
};

TableFace.Row = class TableRow extends React.Component {
    render () {return (
        <tr>{this.props.children}</tr>)}
};

TableFace.Cell = class TableCell extends React.Component {
    render () {return (
        <td>{this.props.children}</td>)}
};

class LoadingSpinnerFace extends React.Component {
    render () {return (
        <>
        <Spinner animation="border" />
        <span className="mr-2">{this.props.text}</span>
        </>
    )}
};

class FileInputFace extends React.Component {
    render () {return (<Form.File {...this.props} label={this.props.text} />)}
};

class TooltipFace extends React.Component {
    render () {
        return (
            <Overlay target={this.props.anchorElement}
                show={this.props.visible} placement="top-start"
            >
                {(props) => (<Tooltip {...props}>{this.props.text}</Tooltip>)}
          </Overlay>
    
        )}
};

class FormUnitFace extends React.Component {
    render () {return (
        <>{this.props.children}</>)}
};

class TextBoxFace extends React.Component {
    render () {
        return (
            <Form.Group>
                <Form.Label>{this.props.label}</Form.Label>
                <Form.Control type="text" {...this.props}/>
            </Form.Group>
        )}
};

class TextAreaFace extends React.Component {
    render () {
        return (
            <Form.Group>
                <Form.Label>{this.props.text}</Form.Label>
                <Form.Control as="textarea" {...this.props}/>
            </Form.Group>
        )}
};

const SelectFace = class SelectClass extends React.Component {
    render () {
        return (
            <Form.Group>
                <Form.Label>{this.props.text}</Form.Label>
                <Form.Control as="select" {...this.props}>
                    {this.props.children}
                </Form.Control>
            </Form.Group>
         )}
};

SelectFace.Option = class SelectOption extends React.Component {
    render () {
        return (
            <option value={this.props.lang} key={this.props.key} 
            >{this.props.text}</option> 
        )}
};

class FormFace extends React.Component {
    render () {return (<Form {...this.props}>{this.props.children}</Form>)}
};

export {RootEl, ModalFace, OliveUx, FooterFace, HeaderFace, ButtonFace,
        TableFace, LoadingSpinnerFace, FileInputFace, TooltipFace,
        FormUnitFace, TextBoxFace, TextAreaFace, SelectFace, FormFace};