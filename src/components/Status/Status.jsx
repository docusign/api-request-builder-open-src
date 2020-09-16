// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import ReactMarkdown from 'react-markdown';
import './Status.css';

class Status extends React.Component {

    /**
     *  m.msg: the message first line
     *  m.style: regular || bold || error || md
     *    Notes: Bold only applies to the first line.
     *           If md (markdown), then msg will be in 
     *           bold and msg2 will be interpreted as markdown
     *    
     *  m.msg2: a secondary message, show on new line
     *  m.msg3: a third line of the message
     *  m.append: append msg to prior status message
     */

    constructor(props) {
        super(props);
        this.state = {
            statuses: [{msg: `API Request Builder`, msg2: this.props.appObject.dsFileMgr.instructions, style: 'md'}]
        }
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    render () {
        let items = [];
        this.state.statuses.forEach(status => {
            if (status.append) {
                items[items.length - 1].msg += status.msg;
                return // EARLY RETURN
            }

            let item = {}
              , style = status.style
              , markdown = status.style === "md";
            if (markdown) {style = 'bold'} // reset since msg will be bold.
            item.msg = status.msg;
            item.className = `Status Status_${style} ${style==='error' ? 'Status_bold':''}`;
            items.push(item);

            if (status.msg2) {
                let item = {};
                item.md = markdown;
                item.msg = status.msg2;
                item.className = `Status_2nd_line ${style === 'error' ? 'Status_error' : ''}`;
                items.push(item);
            }
            if (status.msg3) {
                let item = {};
                item.msg = status.msg3;
                item.className = `Status_2nd_line ${status.style === 'error' ? 'Status_error' : ''}`;
                items.push(item);
            }
            if (status.msg4) {
                let item = {};
                item.msg = status.msg4;
                item.className = `Status_2nd_line ${status.style === 'error' ? 'Status_error' : ''}`;
                items.push(item);
            }
        });

        // We want this.el to be the last message element...
        return <div id="statusDiv" style={{paddingLeft: '30px'}} 
                    ref={ (divElement) => { this.statusDivElement = divElement }}
               >
            <div id="status" className="markdown" ref={el => { this.statusEl = el }}>
                {this.props.oliveUx ? (<h3>Status</h3>) : (<h4>Status</h4>)}
                {items.map( (item, i) =>
                    item.md ? 
                        (<React.Fragment key={`sc${i}`}>
                         <ReactMarkdown source={item.msg} key={`sm${i}`} 
                            className={item.className} linkTarget={() => '_blank' } />
                         <p className='Status_2nd_line'
                            ref={el => { this.el = el }} key={`status${i}`} /> 
                        </React.Fragment>) :  
                        (<p className={item.className}
                            ref={el => { this.el = el }} key={`status${i}`}>{item.msg}</p>
                        )
                )}
           </div>
        </div>
    }
    
    componentDidUpdate() {
        this.scrollToBottom()
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
    }

    updateWindowDimensions() {
        const height = this.statusDivElement.clientHeight;
        this.props.setStatusHeight(height);
    }

    scrollToBottom() {
        const el = this.el,
              statusEl = this.statusEl;
        // First see if there's a scrollbar yet
        // See https://stackoverflow.com/a/5038256/64904
        if (statusEl.scrollHeight > statusEl.clientHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
    }
    
    set(m) {this.setState({statuses: Array.isArray(m) ? m : [m]});}
    append(m) {
        // See https://www.robinwieruch.de/react-state-array-add-update-remove
        this.setState(state => ({statuses: state.statuses.concat(m)}))
    }
    get statuses() {return this.state.statuses}
    
    /**
     * Display the events received from DocuSign
     */
    addQpEvents(href) {
        const dsEvents = {event: true}
            //, href = window.location.href // "http://localhost:3000/?event=signing_complete"
            , sections = href.split("?")
            , hasEvents = sections.length === 2
            , qps = hasEvents ? sections[1].split('&') : []
            ;
        if (!hasEvents) {return} // EARLY RETURN

        let first = true
          , newStatuses = [];
        qps.forEach(i => {
            const parts = i.split('=');
            if (dsEvents[parts[0]]) {
                if (first) {
                    first = false;
                    newStatuses.push ({msg: 'Data received from DocuSign via the URL', 
                        msg2: 'Information Security tip: do not make business decisions ' + 
                        'based on this data since they can be spoofed. Instead, use the API.',
                        style: 'bold'})
                }
                newStatuses.push ({msg: `Name: "${parts[0]}", value: "${parts[1]}"`, style: 'bold'})
            }
        })
        this.append(newStatuses)
    }
}

export default Status;
