import HostsGroup from "./hostsGroup";

const path = require('path');
const mkdirp = require('mkdirp');

import io from './io';
import log from './log';
import Hosts from './hosts';
import { MANIFEST,
         WORKSPACE,
         TOTAL_HOSTS_UID,
         NO_PERM_ERROR_TAG,
         NO_PERM_ERROR_TAG_WIN32 } from '../constants';

try {
    mkdirp.sync(WORKSPACE);
} catch (e) {
    log('Make workspace folder failed: ', e);
}

const sysHostsPath = () => {
    if (process.platform === 'win32') {
        return path.join(process.env.SYSTEMROOT, './system32/drivers/etc/hosts');
    } else {
        return '/etc/hosts';
    }
}

class Manifest {
    constructor (options) {
        const { online, language, hosts } = options;
        this.hosts = new Map();
        if (hosts instanceof Map) {
            this.hosts = hosts;
        } else if (Array.isArray(hosts)) {
            this.hosts = new Map();
            hosts.forEach((hostsObj) => {
                const __hosts = hostsObj.hasOwnProperty("hostsArray") ? new HostsGroup(hostsObj) : new Hosts(hostsObj);
                this.hosts.set(__hosts.uid, __hosts);
            });
        }
        this.online = typeof(online) === 'undefined' ? true : online;
        this.language = typeof(language) === 'undefined' ? navigator.language : language;
    }

    getHostsByUid (uid, groupId) {
        return !uid ? null : (groupId ? this.hosts.get(groupId).get(uid) : this.hosts.get(uid));
    }

    setHostsByUid (groupId, uid, hosts) {
        return !uid ? null : (groupId ? this.hosts.get(groupId).set(uid, hosts) : this.hosts.set(uid, hosts));
    }

    getHostsList () {
        return Array.from(this.hosts.values()).sort((A, B) => {
            return (A.index | 0) - (B.index | 0);
        });
    }

    getHostsGroupList () {
        return this.getHostsList().map((hosts) => {
            return !!hosts.getChildren ? {key: hosts.uid, value: hosts.name} : null;
        }).filter((hosts) => {
            return hosts;
        });
    }

    sortHosts () {
        this.getHostsList().forEach((hosts, index) => {
            hosts.index = index;
        });
    }

    addHosts (hosts, groupId) {
        this.sortHosts();
        if (groupId) {
            const group = this.getHostsByUid(groupId);
            hosts.index = group.getChildren().length;
            group.add(hosts);
        } else {
            hosts.index = this.getHostsList().length;
            this.hosts.set(hosts.uid, hosts);
        }
        return this;
    }

    removeHosts (hosts, groupId) {
        if (groupId) {
            const group = this.getHostsByUid(groupId);
            if (group) group.del(hosts.uid);
        } else {
            this.hosts.delete(hosts.uid);
        }
        this.sortHosts();
        return this;
    }

    moveHostsIndex (fromIndex, toIndex) {
        if (fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex > this.getHostsList().length) {
            return;
        }
        const list = this.getHostsList();
        list.splice(toIndex, 0, list.splice(fromIndex, 1)[0]);
        list.forEach((hosts, index) => {
            hosts.index = index;
        });
    }

    getMergedHosts () {
        let totalCount = 0;
        let totalHostsText = '';
        for (let hosts of this.getHostsList()) {
            if (!this.online) {
                hosts.stashStatus();
                if (!!hosts.getChildren) {
                    hosts.getChildren().forEach((child) => {
                        child.stashStatus();
                    });
                }
            } else {
                hosts.popStatus();
                if (!!hosts.getChildren) {
                    hosts.getChildren().forEach((child) => {
                        child.popStatus();
                    });
                }
            }
            if (hosts.online) {
                let temp = hosts;
                if (!!hosts.getChildren) {
                    temp = hosts.getActiveChild();
                    if (!temp)     continue;
                }
                totalHostsText += temp.text + '\n';
                totalCount += temp.count;
            }
        }
        return new Hosts({
            uid: TOTAL_HOSTS_UID,
            name: 'All',
            count: totalCount,
            text: totalHostsText,
            online: this.online,
        });
    }

    hostsToObject(hosts) {
        const __hosts = hosts.toObject();
        delete __hosts.text;
        if (typeof(hosts.__online) !== 'undefined') {
            __hosts.online = hosts.__online;
        }
        return __hosts;
    }

    toSimpleObject () {
        const __manifest = Object.assign({}, this);
        const simpleHosts = this.getHostsList().map((hosts) => {
            if (!!hosts.getChildren) {
                const __hosts = this.hostsToObject(hosts);
                __hosts.hostsArray = hosts.getChildren().map((child) => {
                    return this.hostsToObject(child);
                }) || [];
                return __hosts;
            } else {
                return this.hostsToObject(hosts);
            }
        });
        __manifest.hosts = simpleHosts;
        return __manifest;
    }

    commit () {
        return io.writeFile(MANIFEST, JSON.stringify(this.toSimpleObject()));
    }

    loadSysHosts () {
        return io.readFile(sysHostsPath(), 'utf-8').then((text) => {
            return Promise.resolve(Hosts.createFromText(text));
        }).catch((e) => {
            log(e);
            return Promise.resolve(null);
        });
    }

    saveSysHosts (hosts) {
        return io.writeFile(sysHostsPath(), this.online ? hosts.text : '').catch((error) => {
            if (error &&
                error.message &&
                (error.message.indexOf(NO_PERM_ERROR_TAG) > -1 ||
                 error.message.indexOf(NO_PERM_ERROR_TAG_WIN32) > -1)) {
                return Promise.reject(error);
            }
            log(error);
            return Promise.resolve();
        });
    }
}

Manifest.loadFromDisk = () => {
    return io.readFile(MANIFEST, 'utf-8').then((text) => {
        try {
            return Promise.resolve(JSON.parse(text));
        } catch (e) {
            return Promise.resolve({});
        }
    }).catch(() => {
        return Promise.resolve({});
    }).then((json) => {
        const { hosts } = json;
        const manifest = new Manifest(json);
        const hostsMap = new Map();
        if (Array.isArray(hosts)) {
            const hostsPromises = hosts.map((item) => {
                const __hosts = item.hasOwnProperty("hostsArray") ? new HostsGroup(item) : new Hosts(item);
                hostsMap.set(__hosts.uid, __hosts);
                return !!__hosts.getChildren ? Promise.all(__hosts.getChildren().map((child) => {
                    return child.load();
                })) : __hosts.load();
            });
            return Promise.all(hostsPromises).then(() => {
                manifest.hosts = hostsMap;
                return Promise.resolve(manifest);
            });
        } else {
            return manifest.loadSysHosts().then((hosts) => {
                hosts.online = true;
                hosts.name = 'Default Hosts';
                hosts.save();
                manifest.addHosts(hosts).commit();
                return Promise.resolve(manifest);
            });
        }
    });
}

export default Manifest;