/* Modified version of the original file. See the LICENSE file */

import React from 'react';
const classNames = require ('classnames');

const MIN = 0;
const MAX = 10;

/**
 * Scale to select NPS value.
 * @param {ReactClass}
 */
class NPSScale extends React.Component {
    constructor(props) {
        super(props);
        this.state = {value: null}

        this.onMouseEnter = this.onMouseEnter.bind(this)    
        this.onMouseLeave = this.onMouseLeave.bind(this)    
        this.onSelect = this.onSelect.bind(this)    
    }

    onMouseEnter(value) {
        this.setState({value: value})}

    onMouseLeave(value) {
        this.setState({value: null})}

    onSelect(value) {
        const { onSubmit } = this.props;
        onSubmit(value);
    }

    render() {
        const { value } = this.state;

        return (
            <div className="NPSScale">
                <div className="NPSScale-Values">
                    <span className='NPSScale-Label'>Not at all likely</span>
                    {range(MIN, MAX).map(i => (
                        <div
                            key={i}
                            className={classNames('NPSScale-Value', {
                                selected: value !== null && (value >= i)
                            })}
                            onMouseEnter={() => this.onMouseEnter(i)}
                            onMouseLeave={() => this.onMouseLeave(i)}
                            onClick={() => this.onSelect(i)}
                        >
                            <div>{i}</div>
                        </div>
                    ))}
                    <span className='NPSScale-Label'>Extremely likely</span>
                </div>
            </div>
        );
    }
}

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx);
}

export default NPSScale;