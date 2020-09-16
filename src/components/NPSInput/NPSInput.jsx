/* Modified version of the original file. See the LICENSE file */

import './NPSInput.css';
import React from 'react';
import NPSScale from './NPSScale';
const classNames = require ('classnames');


/**
 * Prompt the current user for its NPM score.
 * @param {ReactClass}
 */

class NPSInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
                dismissed: false,
                score: null
            }

        this.onSubmit = this.onSubmit.bind(this)    
        this.onDismiss = this.onDismiss.bind(this)    
    }

    /**
     * User clicked on a value.
     */
    onSubmit(score) {
        const { onSubmit } = this.props;
        this.setState({
            score
        }, () => {
            onSubmit({ score });
        });
    }

    /**
     * User clicked to dismiss this form.
     */
    onDismiss() {
        const { onDismissed } = this.props;
        const { score } = this.state;
        this.setState({dismissed: true}, () => {onDismissed({ score })})
    }

    render() {
        const { animated, service, children } = this.props;
        const { score } = this.state;

        const message = service ?
            `How likely are you to recommend ${service} to your friends and co-workers?`
            : 'How likely are you to recommend us to your friends and co-workers?';

        return (
            <div className={classNames('NPSInput', { animated })}>
                <button className="NPSInput-Close" onClick={this.onDismiss}>✕</button>

                {score ? (
                    <div className="NPSInput-Inner">
                        {children ? children({
                            score,
                            dismiss: this.onDismiss
                        }) : undefined}
                    </div>
                ) : (
                    <div className="NPSInput-Inner">
                        <p className="NPSInput-Message">
                            {message}
                        </p>
                        <NPSScale onSubmit={this.onSubmit} />
                    </div>
                )}

            </div>
        );
    }
}

export default NPSInput;
