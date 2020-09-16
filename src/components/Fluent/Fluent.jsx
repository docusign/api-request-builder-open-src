// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';

class Fluent extends React.Component {
    constructor(props) {
        super(props);
        this.show = process.env.SHOW_FLUENT_METHODS === "1";
    }

    render () {
        return (
            <>
                {this.show ?
                <div>
                    <h3>Fluent</h3>
                    <pre><code>{this.props.fluent}</code></pre>
                </div>
                :
                null
                }
            </> )
    }
}

export default Fluent;
