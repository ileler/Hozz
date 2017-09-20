import React, { Component, PropTypes } from 'react';
import cx from 'classnames';

import Lang from '../backend/language';

class SidebarGroupItem extends Component {
    constructor(props) {
        super(props);
    }

    __updateState (e) {
        e.stopPropagation();
        const { onStatusChange } = this.props;
        onStatusChange && onStatusChange();
    }

    render() {
        const { item, child, active, onEdit, onSync, onClick, onRemove } = this.props;
        const classNames = cx({
            'group-sidebar-item': true,
            'active': active,
        });
        const statusClassNames = cx({
            'group-status': true,
            'online': item.online,
        });
        return (<div className={ classNames } onClick={ onClick }>
                    <div className="groupItem">
                        <i className={ statusClassNames } onClick={ this.__updateState.bind(this) }></i>
                        <div className="content">
                            <p className="name">{ item.name }</p>
                            <p className="meta">
                                <span>{ Lang.get('main.hosts_rules', item.counter()) }</span>
                            </p>
                        </div>
                        { onEdit ? <i className="iconfont group-edit" onClick={ onEdit }>&#xe603;</i> : null }
                        { onRemove ? <i className="iconfont group-delete" onClick={ onRemove }>&#xe608;</i> : null }
                    </div>
                    { child }
                </div>);
    }
}

SidebarGroupItem.propTypes = {
    item: PropTypes.object,
    child: PropTypes.array,
    active: PropTypes.bool,
    onEdit: PropTypes.func,
    onClick: PropTypes.func,
    onRemove: PropTypes.func,
    onStatusChange: PropTypes.func,
};

export default SidebarGroupItem;
