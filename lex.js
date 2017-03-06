const fs = require('fs');
const colors = require('colors');
function Lex() {
    this.nfa = {};
    this.dfa = {};
    this.tokens = [];
    this.vn = new Set();      // set存非终结符
    this.vt = new Set();      // set存终结符 
    this.keyword = new Set();        // 关键字
    this.type = new Set();           // 类型
    this.row = 1;
    this.col = 1;
    this.nfaBegin = 'begin';
    // 文法 --> NFA
    this.transNFA = function(grammer, endName){
        for (let i in grammer) {
            let line = grammer[i].split(' ');
            //console.log(line.length);
            this.vn.add(line[0]); 
            this.vt.add(line[1]);
            // 判断有无某一状态，若无则添加边
            if (!this.nfa.hasOwnProperty(line[0])) {
                this.nfa[line[0]] = {};
                this.nfa[line[0]]['edge'] = {};
            }
            // 判断是否为可终止状态
            if (this.nfa[line[0]].hasOwnProperty('edge')) {
                if(!this.nfa[line[0]]['edge'].hasOwnProperty(line[1])){
                    this.nfa[line[0]]['edge'][line[1]] = [];
                    this.nfa[line[0]]['isEndNode'] = false;
                }
            }
            // 非终止状态
            if (line.length === 3) {
                this.vn.add(line[2]);
                this.nfa[line[0]]['edge'][line[1]].push(line[2]);
            }
            else {
                // 加入终结标志
                this.nfa[line[0]]['endName'] = endName;
                this.nfa[line[0]]['isEndNode'] = true;
            }
        }
    };

    // NFA --> DFA
    this.transDFA = function(){
        beginState = {
            isVist : false,
            isEndNode : false,
            dataSet : new Set([this.nfaBegin]) 
        };
        stateSet = {};
        this.dfaBegin = hashSet(beginState['dataSet']);
        stateSet[this.dfaBegin] = beginState;
        let flag = true;
        while (flag) {
            flag = false;
            for (let key in stateSet) {
                if (!stateSet[key]['isVist']) {
                    stateSet[key]['isVist'] = true;
                    if (!this.dfa.hasOwnProperty(key)) {
                        this.dfa[key] = {
                            edge : {},
                            isEndNode : stateSet[key]['isEndNode'],
                            dataSet : stateSet[key]['dataSet']
                        };
                    }
                    for (let vt of this.vt) {
                        newState = {
                            isVist : false,
                            isEndNode : false,
                            dataSet : new Set()
                        };
                        let moveState = moveTo(vt, stateSet[key], this.nfa);
                        if (moveState.isEndNode) {
                            this.dfa[key]['isEndNode'] = true;
                            this.dfa[key]['endName'] = moveState.endName;
                        }
                        newState['dataSet'] = new Set([...newState['dataSet'], ...moveState['dataSet']]);
                        if (newState['dataSet'].size === 0){
                            continue;
                        }
                        nextId = hashSet(newState['dataSet']);
                        //console.log(nextId);
                        if (!stateSet.hasOwnProperty(nextId)) {
                            stateSet[nextId] = newState;
                            flag = true;
                        }
                        this.dfa[key]['edge'][vt] = nextId;
                    }
                }
            }
        }
    };

    // 按照Set产生特殊id
    hashSet = function(dataSet){
        let id = '';
        // js Set()特殊处理
        Array.from(dataSet).sort().forEach((value, index) => {
            if (index === 0) {
                id += value;
            }
            else {
                id = id + '&' + value;
            }
        });
        return id;
    };

    moveTo = function(vt, State, nfa){
        let templateSet = new Set();
        let isEndNode = false;
        let endName = '';
        for (let vn of State['dataSet']) {
            if (nfa[vn]['edge'].hasOwnProperty(vt)) {
                for (let i in nfa[vn]['edge'][vt]){
                    templateSet.add(nfa[vn]['edge'][vt][i]);
                }
            }
            if (nfa[vn]['edge'].hasOwnProperty('&')) {
                isEndNode = true;
                endName = nfa[vn]['endName'];
            }
        }
        let newState = {
            isEndNode : isEndNode,
            endName : endName,
            dataSet : templateSet
        };
        return newState;
    }

    this.getToken = function(input, row){
        let col = 1;
        let e = 0;
        let property = '';
        while (e < input.length) {
            let next = 'begin'
            let element = '';
            while (1) {
                if (this.dfa[next]['edge'].hasOwnProperty(deal(input[e]))) {
                    element += input[e];                  
                    next = this.dfa[next]['edge'][deal(input[e])];
                    e++;
                }
                else {
                    if (this.type.has(element)) {
                        this.tokens.push({
                            row : row,
                            col : col,
                            property : 'type',
                            value : element
                        });
                        col++;
                        break;
                    }
                    if (this.keyword.has(element)) {
                        this.tokens.push({
                            row : row,
                            col : col,
                            property : 'keyword',
                            value : element
                        });
                        col++;
                        break;
                    }
                    if (this.dfa[next].hasOwnProperty('endName')) {
                        property = this.dfa[next]['endName'];
                        if (property === 'space') {
                            break;
                        }                  
                        this.tokens.push({
                            row : row,
                            col : col,
                            property : property,
                            value : element
                        });
                        col++;
                        break;                       
                    }
                    else {
                        throw {row: row, col: col,err: 'TypeError'};
                    }
                }
            }
        }
        
    }

    deal = function(element) {
        if (element === ' ') {
            return 'space';
        }
        else {
            return element;
        }
    }

    this.setKeyword = function(keyword){
        this.keyword = new Set([... this.keyword, ...keyword]);
    };
 
    this.setType = function(type){
        this.type = new Set([... this.type, ...type]);
    };

    // 输出NFA
    this.logNFA = function(){
        for (let key in this.nfa) {
            console.log('state : %s'.red, key);
            let node = this.nfa[key];
            for (let e in node['edge']) {
                console.log('edge: %s'.blue, e, node['edge'][e]);
            }
            console.log('isEndNode:'.yellow, node['isEndNode']);
            if (node['isEndNode']) {
                console.log('endName : '.green, node['endName']);
            }
            else {
                if (node.hasOwnProperty('endName')) {
                    console.log('endName : '.green, node['endName']);
                }
            }
        }
        console.log(this.vn);
        console.log(this.vt);
    };

    // 输出DFA
    this.logDFA = function(){
        for (let key in this.dfa) {
            if (this.dfa[key]['isEndNode']) {
                console.log('%s :'.green, key, this.dfa[key]['endName']);
            }
            if (this.dfa[key]['dataSet'].size > 1) {
                console.log('%s :'.red, key, this.dfa[key]['edge']);
            }
        }
    }
};
module.exports = Lex;