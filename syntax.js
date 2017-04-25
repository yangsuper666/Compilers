const colors = require('colors');
function Syntax(){
    this.vn = new Set();   // 记录非终结符
    this.vt = new Set();   // 记录终结符
    this.v = new Set();  
    this.firstSet = {};    // first集合
    this.exp = [];      
    this.exp_dic = {};     // 文法产生式
    this.projectSet = [];  // 项目集族
    this.action = [];      // action表
    this.goto = [];        // goto表
    let src = {index : 0, pos : 0, fro : new Set(['#']), length : 1};  // 初始项
    
    // 读取文法
    this.readSyn = function(grammer, index){
        let noterminate = grammer.split(':')[0];
        this.vn.add(noterminate);
        let production = grammer.split(':')[1].split(' ');
        for (let i in production) {
            this.v.add(production[i]);
        }
        this.v.add(noterminate);
        if (!this.exp_dic.hasOwnProperty(noterminate)) {
            this.exp_dic[noterminate] = [];
        }
        this.exp_dic[noterminate].push([production, index]);
        this.exp.push([noterminate, production]);
    }

    // 获取终结符和非终结符
    this.getVn_Vt = function(){
        // 求差集
        this.vt = new Set([... this.v].filter(v => !this.vn.has(v)));
        this.vt.forEach(vt => this.firstSet[vt] = new Set([vt]));
    }

    // 求出First集
    this.getFirstSet = function(v, all){
        if (this.firstSet.hasOwnProperty(v)) {
            return this.firstSet[v];
        }
        all.add(v);
        let first = new Set();
        for (let i = 0; i < this.exp_dic[v].length; i++) {
            for (let j = 0; j < this.exp_dic[v][i][0].length; j++) {
                let element = this.exp_dic[v][i][0][j];
                if (all.has(element)) {
                    continue;
                }
                let tempSet = new Set();
                if (this.firstSet.hasOwnProperty(element)) {
                    tempSet = this.firstSet[element];
                }
                else {
                    tempSet = this.getFirstSet(element, all);
                }
                first = new Set([... first, ... tempSet]);
                if (!tempSet.has('$')) {
                    break;
                }
            }
        }
        return first;
    }
    
    //hash项目
    hashSet = function(item){
        let hash = '';
        hash = item.index + '&' + item.pos + '&(';
        Array.from(item.fro).sort().forEach(value => hash = hash + '[' + value + ']');
        hash = hash + ')&' + item.length;
        return hash;
    }

    // 判断项目集有无相同项目
    isInPro = function(closure, item){
        for (let i in closure) {
            if (closure[i].index === item.index && closure[i].pos === item.pos) {
                return i;
            }
        }
        return -1;
    }

    // 判断项目集族中有无相同项目集
    isInProSet = function(proSet, temp){
        for (let i in proSet) {
            let flag = 0;
            if (temp.length === proSet[i]['set'].length) {
                for (let j in temp) {
                    if (proSet[i]['set'][j].hash !== temp[j].hash){
                        flag = 1;
                        break;
                    }
                }
                if (flag === 0) {
                    return i;
                }
            }
            else continue;
        }
        return -1;
    }

    // 求出first(βa)
    getExtend = function(exp, first, node){
        if ((node.pos + 1) === node.length) {
            return node.fro;
        }
        let front = new Set();
        for (let i = node.pos + 1; i < exp[1].length; i++){
            let tempSet = first[exp[1][i]];
            front = new Set([... front, ... tempSet]);
            if (!tempSet.has('$')) {
                front.delete('$');
                return front;
            }
        }
        front = new Set([... front, ... node.fro]);
        return front;
    }

    // 求出项目集闭包
    getClosure = function(item, par){
        let closure = [];
        closure.push(item);
        let i = 0;
        while (i < closure.length) {
            let exp_id = closure[i].index;
            let exp_pos = closure[i].pos;
            let target = par.exp[exp_id][1][exp_pos];
            if (par.vt.has(target)) {
                i++;
                continue;
            }
            let front = getExtend(par.exp[exp_id], par.firstSet, closure[i]);
            for (let j in par.exp_dic[target]) {
                let node_id = parseInt(par.exp_dic[target][j][1]);
                let length = par.exp_dic[target][j][0].length;
                let tempItem = {index :node_id, pos : 0, fro : front, length : length};
                let hash = hashSet(tempItem);
                tempItem['hash'] = hash;
                let flag = isInPro(closure, tempItem);
                if ( flag === -1){
                    closure.push(tempItem);
                }
                else {
                    closure[flag]['fro'] = new Set([... tempItem['fro'], ... closure[flag]['fro']]);
                    closure[flag]['hash'] = hashSet(closure[flag]);
                }
            }
            i++;
        }
        return closure;
    }
    
    // 构造项目集族
    this.getSyntaxDFA = function(){
        let tempSet = [];
        let hash = hashSet(src);
        src['hash'] = hash;
        tempSet.push({id : 0, set: getClosure(src, this)});
        let i = 0, countId = 0;
        while (i < tempSet.length) {
            let item = tempSet[i]['set'];
            for (let j in item) {
                if (item[j].pos >= item[j].length) {
                    continue;
                }
                let nextpos = item[j].pos + 1;
                let tempItem = {
                    index: item[j].index,
                    pos: nextpos, 
                    fro: item[j].fro, 
                    length: item[j].length
                };
                let hash = hashSet(tempItem);
                tempItem['hash'] = hash;
                let set_clo = getClosure(tempItem, this);
                if (!tempSet[i].hasOwnProperty('next')) {
                    tempSet[i]['next'] = {};
                }
                let edge = this.exp[tempItem.index][1][nextpos - 1];
                if (!tempSet[i]['next'].hasOwnProperty(edge)) {
                    tempSet[i]['next'][edge] = [];
                }
                if (edge === '$') {
                    tempSet[i]['next']['$'].push({
                        exp_id : item[j].index,
                        vt : Array.from(item[j].fro)
                    });
                    continue;
                }             
                // 判断是否生成重复项目集族
                let sameSetId = isInProSet(tempSet, set_clo);
                if (sameSetId < 0) {
                    countId++;
                    let temp = {id: countId, set: set_clo};
                    tempSet.push(temp);
                    tempSet[i]['next'][edge].push(parseInt(countId));
                }
                else {
                    tempSet[i]['next'][edge].push(parseInt(sameSetId));
                }
            }
            i++;
        }  
        tempSet.forEach(value => {
            value['isacc'] = false;
            for (let i in value['set']) {
                value['set'][i]['fro'] = Array.from(value['set'][i]['fro']);
                if (value['set'][i]['index'] === 0 && value['set'][i]['pos'] === 1) {
                    value['isacc'] = true;
                }
            }
        });
        this.projectSet = tempSet;
    }

    // 构造Action和Goto表
    this.getAction_Goto = function(){
        let Vn = this.vn;
        let Vt = this.vt;
        Vn.delete("S1");
        // Vn.delete('start1');
        Vn = Array.from(Vn);
        Vt.delete("$");
        Vt = Array.from(Vt);
        for (let i in this.projectSet) {
            let tempAction = {};
            let tempGoto = {};
            // tempAction['#'] = {};
            let pro = this.projectSet[i];
            if (pro.hasOwnProperty('next')) {
                for (let j in Vt) {
                    
                    if (pro['next'].hasOwnProperty(Vt[j])) {
                        tempAction[Vt[j]] = {};
                        tempAction[Vt[j]]['isend'] = false;
                        tempAction[Vt[j]]['next'] = pro['next'][Vt[j]];
                    }
                }
                if (pro['next'].hasOwnProperty('$')) {
                    let temp = pro['next']['$'];
                    for (let t in temp) {
                        for (let v in temp[t]['vt']) {
                            tempAction[temp[t]['vt'][v]] = {};
                            tempAction[temp[t]['vt'][v]]['isend'] = true;
                            tempAction[temp[t]['vt'][v]]['next'] = temp[t].exp_id;
                        }
                    }
                }
                for (let k in Vn) {
                    // tempGoto[Vn[k]] = []; 
                    if (pro['next'].hasOwnProperty(Vn[k])) {
                        tempGoto[Vn[k]] = pro['next'][Vn[k]];
                    }              
                }               
            }
            else {
                // for (let j in Vt) tempAction[Vt[j]] = {};           
                // for (let k in Vn) tempGoto[Vn[k]] = [];
                let temp = pro['set'][0];
                let index = temp.index;
                for (let l in temp['fro']) {
                    tempAction[temp['fro'][l]] = {};
                    tempAction[temp['fro'][l]]['isend'] = true;
                    tempAction[temp['fro'][l]]['next'] = index;
                }
            }
            this.action.push(tempAction);
            this.goto.push(tempGoto);
        }
    }
}
module.exports = Syntax;