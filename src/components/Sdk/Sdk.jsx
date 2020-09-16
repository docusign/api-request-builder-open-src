// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import Highlight, { defaultProps } from "prism-react-renderer";
import Json from '../Json';

/**
 * ToDo: Add more language support to Prism. See https://github.com/FormidableLabs/prism-react-renderer#faq
 */

class Sdk extends React.Component {
    render () {
        /**
         * Props:   maxWidth
                    appObject
                    json
                    sdk
                    sdkLanguage
                    sdkLanguageName
         */

        if (this.props.json && this.props.json.block_error) {
            return <div id="sdk" className="Status Status_error Status_bold">
                {this.props.json.block_error}
            </div>
        } else if (this.props.sdkLanguage === this.props.appObject.langJson) {
            return <Json json={this.props.json} />
        } else if (this.props.sdk) {
            return <div id="sdk" style={{maxWidth: this.props.maxWidth}}>
                <Highlight {...defaultProps} code={this.props.sdk} 
                    theme={undefined} language="javascript">
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={className} style={style}>
                        {tokens.map((line, i) => (
                        <div {...getLineProps({ line, key: i })}>
                            {line.map((token, key) => (
                            <span {...getTokenProps({ token, key })} />
                            ))}
                        </div>
                        ))}
                    </pre>
                    )}
                </Highlight>
            </div>
        } else {
            return null
        }
    }
}

export default Sdk;
