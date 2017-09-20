import React, { Component, PropTypes } from 'react';

import Lang from '../backend/language';

class HostsInfoDialog extends Component {
    constructor(props) {
        super(props);
        const { url, name, groupId, type } = props;
        this.state = {
            editing: !!name,
            url,
            name,
            groupId,
            type: type || 'hosts'
        };
    }

    __onGroupChange (e) {
        const { onInputChange, groupId } = this.props;
        this.setState({ groupId: e.target.value });
        onInputChange && onInputChange(this.state.type, this.state.name, this.state.url, e.target.value, groupId);
    }

    __onNameChange (e) {
        const { onInputChange, groupId } = this.props;
        this.setState({ name: e.target.value });
        onInputChange && onInputChange(this.state.type, e.target.value, this.state.url, this.state.groupId, groupId);
    }

    __onUrlChange (e) {
        const { onInputChange, groupId } = this.props;
        this.setState({ url: e.target.value });
        onInputChange && onInputChange(this.state.type, this.state.name, e.target.value, this.state.groupId, groupId);
    }

    __onPressEnter (e) {
        const { onHostDialogOK } = this.props;
        onHostDialogOK && e.keyCode === 13 && onHostDialogOK();
    }

    __onChangeType (type) {
        this.setState({ type: type });
    }

    render() {
        const { name, url, onDismiss, groupList, groupId } = this.props;
        const { type, editing } = this.state;
        const groupItems = (groupList || []).map((group, index) => {
            return (<option value={ group.key } key={ group.key }>{ group.value }</option>);
        });
        return (<div className="popover new-hosts-dialog">
                    <div className="popover-content">
                        <div className="dialog-title">
                            <span>{
                                !name ?
                                Lang.get('main.create_new_hosts') :
                                Lang.get('main.edit_hosts') }</span>
                            <i className="iconfont close" onClick={ onDismiss }>&#xe602;</i>
                        </div>
                        <div className="vertical-inputs">
                            {!editing ?
                                <div>
                                    <span onClick={this.__onChangeType.bind(this, 'hosts')}><input type="radio" title="hosts" name="addType" onChange={this.__onChangeType.bind(this, 'hosts')} checked={ !type || type=='hosts' }/>hosts</span>
                                    <span onClick={this.__onChangeType.bind(this, 'group')}><input type="radio" title="group" name="addType" onChange={this.__onChangeType.bind(this, 'group')} checked={ type=='group' }/>group</span>
                                </div>
                                : null}
                            {!type || type == 'hosts' ?
                                <select onChange={ this.__onGroupChange.bind(this) } defaultValue={groupId}>
                                    <option value={ '' }>default</option>
                                    { groupItems }
                                </select>
                                : null}
                            <input
                                type="text"
                                defaultValue={ name }
                                placeholder={ Lang.get('common.name') }
                                onKeyDown={ this.__onPressEnter.bind(this) }
                                onChange={ this.__onNameChange.bind(this) } />
                            {!type || type == 'hosts' ?
                                <input
                                    type="text"
                                    defaultValue={ url }
                                    onChange={ this.__onUrlChange.bind(this) }
                                    onKeyDown={ this.__onPressEnter.bind(this) }
                                    placeholder={ Lang.get('main.remote_source_url') } />
                                : null}

                        </div>
                    </div>
                    <div className="popover-arrow"></div>
                </div>);
    }
}

HostsInfoDialog.propTypes = {
    type: PropTypes.string,
    url: PropTypes.string,
    name: PropTypes.string,
    groupId: PropTypes.string,
    groupList: PropTypes.array,
    onDismiss: PropTypes.func,
    onInputChange: PropTypes.func,
    onHostDialogOK: PropTypes.func,
}

export default HostsInfoDialog;
