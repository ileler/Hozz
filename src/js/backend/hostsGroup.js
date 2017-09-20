const path = require('path');
import UID from 'uid';

import Hosts from './hosts';

class HostsGroup {
    constructor(options) {
        const {uid, index, name, online, hostsArray, activationHostsId} = options;
        this.uid = uid || UID(16);
        this.index = index || 0;
        this.name = name || '';
        this.online = online || false;
        this.hostsArray = (hostsArray || []).map((child) => {
            child['groupId'] = this.uid;
            return child.toObject ? child : new Hosts(child);
        });
        this.activationHostsId = activationHostsId || '';
    }

    getChildren() {
        return this.hostsArray;
    }

    getActiveChild() {
        const active = this.hostsArray.filter((child) => {
            return (child.uid === this.activationHostsId) ? child : null;
        }) || [];
        if (this.hostsArray && this.hostsArray.length > 0 && active.length < 1) {
            this.activationHostsId = this.hostsArray[0].uid;
            return this.hostsArray[0];
        }
        return active.length > 0 ? active[0] : null;
    }

    del(uid) {
        this.hostsArray = this.hostsArray.filter((child) => {
            return (child.uid !== uid);
        });
    }

    get(uid) {
        const hosts = this.hostsArray.filter((child) => {
            return (child.uid === uid) ? child : null;
        });
        return (hosts && hosts.length > 0 && hosts[0]) || null;
    }

    set(uid, hosts) {
        this.hostsArray = this.hostsArray.map((child) => {
            return (child.uid === uid) ? hosts : child;
        });
    }

    add(hosts) {
        this.hostsArray[this.hostsArray.length] = hosts;
    }

    toObject() {
        return {
            uid: this.uid,
            index: this.index,
            name: this.name,
            online: this.online,
            activationHostsId: this.activationHostsId || '',
        };
    }

    toggleStatus () {
        this.online = !this.online;
    }

    stashStatus () {
        if (typeof(this.__online) === 'undefined') {
            this.__online = this.online;
            this.online = false;
        }
    }

    popStatus () {
        if (typeof(this.__online) !== 'undefined') {
            this.online = this.__online;
            delete this.__online;
        }
    }

    counter() {
        var hosts = this.getActiveChild();
        return hosts && hosts.counter() || 0;
    }

}

export default HostsGroup;