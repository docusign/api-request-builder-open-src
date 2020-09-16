// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import Highlight, { defaultProps } from "prism-react-renderer";

// Syntax highlighting:
// https://medium.com/young-developer/react-markdown-code-and-syntax-highlighting-632d2f9b4ada

class Json extends React.Component { 
    render () {
        let exampleCode = JSON.stringify(this.props.json, null, '  ');
        return <div id="sdk">
            <Highlight {...defaultProps} code={exampleCode} 
                theme={undefined} language="json">
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <><pre className={className} style={style}>
                    {tokens.map((line, i) => (
                    <div {...getLineProps({ line, key: i })}>
                        {line.map((token, key) => (
                        <span {...getTokenProps({ token, key })} />
                        ))}
                    </div>
                    ))}
                </pre>
                <p><b>Note:</b> To use the JSON format, remove all <b>filename</b> attributes and replace
                with the <b>documentBase64</b> attribute. The filename attribute is only used by the
                API Request Builder application.
                </p></>
                )}
            </Highlight>
        </div>
    }
}

export default Json;
