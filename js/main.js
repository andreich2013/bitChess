/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var Chess = (function (win) {

    var FIELD = {
            white: parseInt('10', 2),
            black: parseInt('11', 2)
        },
        tmp = [];

    tmp[11] = 'A1'; tmp[12] = 'A2'; tmp[13] = 'A3'; tmp[14] = 'A4'; tmp[15] = 'A5'; tmp[16] = 'A6'; tmp[17] = 'A7'; tmp[18] = 'A8';
    tmp[21] = 'B1'; tmp[22] = 'B2'; tmp[23] = 'B3'; tmp[24] = 'B4'; tmp[25] = 'B5'; tmp[26] = 'B6'; tmp[27] = 'B7'; tmp[28] = 'B8';
    tmp[31] = 'C1'; tmp[32] = 'C2'; tmp[33] = 'C3'; tmp[34] = 'C4'; tmp[35] = 'C5'; tmp[36] = 'C6'; tmp[37] = 'C7'; tmp[38] = 'C8';
    tmp[41] = 'D1'; tmp[42] = 'D2'; tmp[43] = 'D3'; tmp[44] = 'D4'; tmp[45] = 'D5'; tmp[46] = 'D6'; tmp[47] = 'D7'; tmp[48] = 'D8';
    tmp[51] = 'E1'; tmp[52] = 'E2'; tmp[53] = 'E3'; tmp[54] = 'E4'; tmp[55] = 'E5'; tmp[56] = 'E6'; tmp[57] = 'E7'; tmp[58] = 'E8';
    tmp[61] = 'F1'; tmp[62] = 'F2'; tmp[63] = 'F3'; tmp[64] = 'F4'; tmp[65] = 'F5'; tmp[66] = 'F6'; tmp[67] = 'F7'; tmp[68] = 'F8';
    tmp[71] = 'G1'; tmp[72] = 'G2'; tmp[73] = 'G3'; tmp[74] = 'G4'; tmp[75] = 'G5'; tmp[76] = 'G6'; tmp[77] = 'G7'; tmp[78] = 'G8';
    tmp[81] = 'H1'; tmp[82] = 'H2'; tmp[83] = 'H3'; tmp[84] = 'H4'; tmp[85] = 'H5'; tmp[86] = 'H6'; tmp[87] = 'H7'; tmp[88] = 'H8';

    var FIELDS = tmp,

        PIECES = {
            king: parseInt('00100', 2),
            queen: parseInt('01000', 2),
            rook: parseInt('01100', 2),
            bishop: parseInt('10000', 2),
            knight: parseInt('10100', 2),
            pawn: parseInt('11000', 2)
        },
        
        COLOR = {
            white: parseInt('1000000', 2),
            black: parseInt('1100000', 2)
        },
        
        STATE = {
            check: parseInt('010000000', 2),
            checkmate: parseInt('100000000', 2),
            draw: parseInt('110000000', 2)
        },

        MASK = {
            field: parseInt('11', 2),
            piece: parseInt('11100', 2),
            color: parseInt('1100000', 2),
            pieceColor: parseInt('1111100', 2),
            state: parseInt('110000000', 2),
            empty: parseInt('11', 2)
        },

        bit = {
            is: {
                empty: function (value) {
                    return (value & ~MASK.empty) === 0;
                }
            },
            has: {
                field: function (value, search) {
                    return (value & MASK.field) == search;
                },
                piece: function (value, search) {
                    return (value & MASK.piece) == search;
                },
                color: function (value, search) {
                    return (value & MASK.color) == search;
                },
                state: function (value, search, condition) {
                    return (value & MASK.state) == search;
                }
            }
        },

        strategy = (function() {

            var getPossibleDir = {
                    king: {
                        move: function (from, to, coords, hash, fields) {
                            var index = calculateIndex(coords, from),
                                value = this.fields[index];

                            return value === undefined || !bit.is.empty(value) ? [] : [index];
                        },
                        beat: function (from, to, dir, hash, fields) {
                            return [];

                            var value = this.fields[to],
                                enemyColor = hash.color === COLOR.white ? COLOR.black : COLOR.white;

                            if(value === undefined || bit.is.empty(value)) {
                                return [];
                            }

                            return this.fields.some(function (item) {
                                return bit.has.color(item, enemyColor) && getPossibleDir[value & MASK.piece].defend(from, to, dir, hash, fields);
                            });
                        },
                        castling: function () {
                            return [];
                        }
                    },
                    knight: {
                        move: function (from, to, coords, hash, fields) {
                            var index = calculateIndex(coords, from),
                                value = this.fields[index],
                                bool = value === undefined || (!bit.is.empty(value) && bit.has.color(value, hash.color));

                            return bool ? [] : [index];
                        }
                    },
                    queen: {
                        move: function (from, to, coords, hash, fields) {
                            var list = [];

                            from = calculateIndex(coords, from);

                            while(this.fields[from] !== undefined) {
                                if(from === to) {
                                    return list;
                                }

                                if(!bit.is.empty(this.fields[from])) {
                                    if(!bit.has.color(this.fields[from], hash.color)) {
                                        list.push(from)
                                    }
                                    return list;
                                }

                                list.push(from);

                                from = calculateIndex(coords, from);
                            }

                            return list;
                        }
                    },
                    pawn: {
                        move: function (from, to, coords, hash, fields) {
                            var list = [],
                                i = calculateIndex(coords, from),
                                y;

                            do {
                                from = i;

                                if(from === to || this.fields[from] === undefined) {
                                    return list;
                                }

                                if(!bit.is.empty(this.fields[from])) {
                                    return list;
                                }

                                list.push(from);

                                i = calculateIndex(coords, from);
                                y = getCoordY(i);
                            } while(this.fields[i] !== undefined && (fields[0] <= y && fields[1] >= y));

                            return list;
                        },
                        beat: function (from, to, coords, hash, fields) {
                            var index = calculateIndex(coords, from),
                                value = this.fields[index],
                                bool = value === undefined || bit.is.empty(value) || bit.has.color(value, hash.color);

                            return bool ? [] : [index];
                        }
                    }
                };

            function calculateIndex(coords, index) {
                var str = index + '';

                return +('' + (+str[0] + coords[0]) + (+str[1] + coords[1]));
            }

            function getCoordX(index) {
                return +((index + '')[0]);
            }

            function getCoordY(index) {
                return +((index + '')[1]);
            }

            var possible = {};

            possible[PIECES.rook] = [[-1,0], [+1,0], [0,-1], [0,+1]];
            possible[PIECES.bishop] = [[-1,-1], [-1,+1], [+1,+1], [+1,-1]];
            possible[PIECES.knight] = [[-2,+1], [-1,+2], [+1,+2], [+2,+1], [-1,-2], [-2,-1], [+1,-2], [+2,-1]];
            possible[PIECES.queen] = possible[PIECES.rook].concat(possible[PIECES.bishop]);
            possible[PIECES.king] = possible[PIECES.queen];
            possible[PIECES.pawn] = { move: {}, beat: {} };
            possible[PIECES.pawn].move[COLOR.white] = [[0, +1]];
            possible[PIECES.pawn].move[COLOR.black] = [[0, -1]];
            possible[PIECES.pawn].beat[COLOR.white] = [[+1, +1], [-1, +1]];
            possible[PIECES.pawn].beat[COLOR.black] = [[+1, -1], [-1, -1]];

            return {
                [PIECES.king]: function (from, to, hash) {
                    var list = [];

                    if(bit.has.color(this.fields[to], hash.color)) {
                        return false;
                    }

                    possible[PIECES.king].forEach(function(coords) {
                        list = list .concat(getPossibleDir.king.move.apply(this, [from, to, coords, hash]))
                                    .concat(getPossibleDir.king.beat.apply(this, [from, to, coords, hash]))
                                    .concat(getPossibleDir.king.castling.apply(this, [from, to, coords, hash]))
                    }, this);

                    return list;
                },
                [PIECES.queen]: function (from, to, hash) {
                    var list = [];

                    if(bit.has.color(this.fields[to], hash.color)) {
                        return false;
                    }

                    possible[PIECES.queen].forEach(function(coords) {
                        list = list.concat(getPossibleDir.queen.move.apply(this, [from, to, coords, hash]));
                    }, this);

                    return list;
                },
                [PIECES.rook]: function (from, to, hash) {
                    var list = [];

                    if(bit.has.color(this.fields[to], hash.color)) {
                        return false;
                    }

                    possible[PIECES.rook].forEach(function(coords) {
                        list = list.concat(getPossibleDir.queen.move.apply(this, [from, to, coords, hash]));
                    }, this);

                    return list;
                },
                [PIECES.bishop]: function (from, to, hash) {
                    var list = [];

                    if(bit.has.color(this.fields[to], hash.color)) {
                        return false;
                    }

                    possible[PIECES.bishop].forEach(function(dir) {
                        list = list.concat(getPossibleDir.queen.move.apply(this, [from, to, dir, hash]));
                    }, this);

                    return list;
                },
                [PIECES.knight]: function (from, to, hash) {
                    var list = [];

                    if(bit.has.color(this.fields[to], hash.color)) {
                        return false;
                    }

                    possible[PIECES.knight].forEach(function(coords) {
                        list = list.concat(getPossibleDir.knight.move.apply(this, [from, to, coords, hash]));
                    }, this);

                    return list;
                },
                [PIECES.pawn]: (function () {
                    var field = {};

                        field[COLOR.white] = [1, 4];
                        field[COLOR.black] = [5, 8];

                    return function (from, to, hash) {
                        var list = [];

                        if(bit.has.color(this.fields[to], hash.color)) {
                            return false;
                        }

                        possible[PIECES.pawn].move[hash.color].forEach(function(coords) {
                            list = list.concat(getPossibleDir.pawn.move.apply(this, [from, to, coords, hash, field[hash.color]]));
                        }, this);

                        possible[PIECES.pawn].beat[hash.color].forEach(function(coords) {
                            list = list.concat(getPossibleDir.pawn.beat.apply(this, [from, to, coords, hash, field[hash.color]]));
                        }, this);

                        return list;
                    };
                }())
            };

        }());

    var recreateFields = (function () {
        var rows = [[11, 18], [31, 38], [51, 58], [71, 78]];

        function checkRow(index) {
            return rows.some(function check(row) {
                return row[0] <= index && row[1] >= index;
            }) ? 0 : 1;
        }

        return function (item, index) {
            return index % 2 === checkRow(index) ? FIELD.white : FIELD.black;
        };
    }());

    var Base = function () {
        
        this.on = function(eventName, handler, context) {
            if (!this._eventHandlers) this._eventHandlers = [];
            if (!this._eventHandlers[eventName]) this._eventHandlers[eventName] = [];
            this._eventHandlers[eventName].push({fn: handler, ctx: context});
        }

        this.off = function(eventName, handler) {
            var handlers = this._eventHandlers[eventName];
            if (!handlers) return;
            for(var i=0; i<handlers.length; i++) {
                if (handlers[i].fn == handler) handlers.splice(i--, 1);
            }
        }

        this.trigger = function(eventName) {
            if (!this._eventHandlers || !this._eventHandlers[eventName]) return;
            
            var args = [].slice.call(arguments, 1);
            this._eventHandlers[eventName].forEach(function(item) {
                item.fn.apply(item.ctx || this, args);
            }, this);
        }
        
    }

    var Model = function () {
        Base.call(this);

        this.fields = FIELDS.map(recreateFields);

        this.arrangePieces = function () {
            this.clearAllFields();
            
            this.fillFields(['A1', 'H1'], [PIECES.rook, COLOR.white]);
            this.fillFields(['B1', 'G1'], [PIECES.knight, COLOR.white]);
            this.fillFields(['C1', 'F1'], [PIECES.bishop, COLOR.white]);
            this.fillField('D1', [PIECES.queen, COLOR.white]);
            this.fillField('E1', [PIECES.king, COLOR.white]);
            this.fillFields(['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2'], [PIECES.pawn, COLOR.white]);
            
            this.fillFields(['A8', 'H8'], [PIECES.rook, COLOR.black]);
            this.fillFields(['B8', 'G8'], [PIECES.knight, COLOR.black]);
            this.fillFields(['C8', 'F8'], [PIECES.bishop, COLOR.black]);
            this.fillField('D8', [PIECES.queen, COLOR.black]);
            this.fillField('E8', [PIECES.king, COLOR.black]);
            this.fillFields(['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'], [PIECES.pawn, COLOR.black]);
        }
        
        this.init = function () {
            //this.arrangePieces();
            this.fillField('F4', [PIECES.king, COLOR.white]);
            this.fillField('D5', [PIECES.pawn, COLOR.white]);
            this.fillField('H7', [PIECES.pawn, COLOR.black]);
            this.fillField('G8', [PIECES.bishop, COLOR.black]);
            this.fillField('D4', [PIECES.queen, COLOR.black]);
            this.fillField('A6', [PIECES.knight, COLOR.black]);
            this.fillField('H3', [PIECES.rook, COLOR.white]);
        };
        
    };

    Model.prototype.getFieldIndex = function (field) {
        return (typeof field).toLowerCase() === 'number' ? field : FIELDS.indexOf(field);
    }

    Model.prototype.getField = function (field) {
        return this.fields[this.getFieldIndex(field)];
    }

    Model.prototype.isEmptyField = function (field) {
        return bit.is.empty(this.getField(field));
    }

    Model.prototype.isExistsField = function (field) {
        return this.getField(field) !== undefined;
    }

    Model.prototype.hasField = function (field, hash) {
        var value = this.getField(field);

        for(var key in hash) {
            if(!hash.hasOwnProperty(key)) {
                continue;
            }

            if((value & MASK[key]) != hash[key]) {
                return false;
            }
        }

        return true;
    }

    Model.prototype.hasFieldColor = function (field, color) {
        return (this.getField(field) & MASK.color) == color;
    }

    Model.prototype.hasFields = function (fieldList, hash) {
        for(var i = 0, length = fieldList.length; length > i; i+=1) {
            if(!this.hasField(fieldList[i], hash)) {
                return false;
            }
        }
        
        return true;
    }

    Model.prototype.clearField = function (field) {
        var i = this.getFieldIndex(field);
    
        this.fields[i] = (this.fields[i] & MASK.field) == FIELD.white ? FIELD.white : FIELD.black;
                          
        this.trigger("field:change", i);
    }
    
    Model.prototype.clearFields = function (fieldList) {
        fieldList.forEach(function(item) {
            this.clearField(item);
        }, this);
    }
    
    Model.prototype.clearAllFields = function () {
        this.fields.forEach(recreateFields, this);
        
        this.trigger("fields:change", FIELDS);
    }

    Model.prototype.fillField = function (field, list) {
        var i = this.getFieldIndex(field),
            value = this.fields[i];

        list.forEach(function(item) {
            value = value | item;
        }, this);

        this.fields[i] = value;
                        
        this.trigger("field:change", i);
    }
    
    Model.prototype.fillFields = function (fieldList, list) {
        fieldList.forEach(function(item) {
            this.fillField(item, list);
        }, this);
    }

    Model.prototype.parseField = function (field) {
        var value = this.getField(field);
        
        return {
            piece: value & MASK.piece,
            color: value & MASK.color,
            state: value & MASK.state
        }
    }

    Model.prototype.calculatePossibleMoves = function (from, to) {
        if(this.isEmptyField(from)) {
            return;
        }
        
        var hash = this.parseField(from),
            list = strategy[hash.piece].apply(this, [this.getFieldIndex(from), this.getFieldIndex(to), hash]);
        
        this.trigger("piece:calculatePossibleMoves", list);
    }

    Model.prototype.move = function (from, to) {
        if(this.isEmptyField(from)) {
            return;
        }
        
        var hash = this.parseField(from);

        this.calculatePossibleMoves(this.getFieldIndex(from));

        if(!strategy[hash.piece].apply(this, [this.getFieldIndex(from), this.getFieldIndex(to), hash])) {
            return;
        }
        
        this.clearFields([from, to]);
        this.fillField(to, [hash.piece, hash.color, hash.state]);
    }

    Model.prototype.hasFieldThreatState = function (field) {
        return [STATE.check].indexOf(this.getField(field) & MASK.state) !== -1;
    }

    Model.prototype.hasColorThreatState = function (color) {
        var threat = [STATE.check];

        for(var i = 0, length = this.fields.length; length > i; i+=1) {
            if(bit.has.color(this.fields[i], color)) {
                return threat.indexOf(this.fields[i] & MASK.state) !== -1;
            }
        }

        return false;
    }

    Model.prototype.checkState = function (color) {

    }

    Model.prototype.refreshState = function (color, state) {
        this.fields.forEach(function(item) {
            if(bit.has.color(item, color)) {
                this.fillField(item, [state]);
            }
        }, this);
    }

    var View = (function() {

        var pieces = {};

        pieces[PIECES.king | COLOR.white] = '&#9812';
        pieces[PIECES.queen | COLOR.white] = '&#9813';
        pieces[PIECES.rook | COLOR.white] = '&#9814';
        pieces[PIECES.bishop | COLOR.white] = '&#9815';
        pieces[PIECES.knight | COLOR.white] = '&#9816';
        pieces[PIECES.pawn | COLOR.white] = '&#9817';
        pieces[PIECES.king | COLOR.black] = '&#9818';
        pieces[PIECES.queen | COLOR.black] = '&#9819';
        pieces[PIECES.rook | COLOR.black] = '&#9820';
        pieces[PIECES.bishop | COLOR.black] = '&#9821';
        pieces[PIECES.knight | COLOR.black] = '&#9822';
        pieces[PIECES.pawn | COLOR.black] = '&#9823';

        return function (el, model) {
            Base.call(this);

            this.el = el;

            this.fields = [];

            this.renderChessBoard = function(field) {
                model.fields.forEach(function(item, index) {
                    var td = this.fields[index];

                    td.dataset.index = index;

                    if(bit.has.field(item, FIELD.black)) {
                        td.classList.add('field-black');
                    }
                }, this);
            }

            this.renderField = function(field) {
                var i = model.getFieldIndex(field),
                    value = model.fields[i] & MASK.pieceColor;

                this.fields[i].innerHTML = value > 0 ? pieces[value] : '';
            }

            this.renderFields = function(fieldList) {
                fieldList.forEach(function(item) {
                    this.renderField(item);
                }, this);
            }

            this.renderPossibleMoves = function(list) {
                model.fields.forEach(function(item, index) {
                    this.fields[index].classList[list.indexOf(index) !== -1 ? 'add' : 'remove']('possible-move');
                }, this);
            }

            this.init = function() {
                Array.prototype.slice.call(el.querySelectorAll('tbody td.field')).forEach(function(item, index) {
                    this.fields[FIELDS.indexOf(item.dataset.field)] = item;
                }, this);

                this.renderChessBoard();

                model.init();
                var tmp = null;
                model.fields.forEach(function(item, index) {
                    this.fields[index].addEventListener('click', function(e) {
                        if(!tmp) {
                            model.calculatePossibleMoves(parseInt(this.dataset.index, 10));
                            tmp = this.dataset.field;
                        } else {
                            model.move(tmp, this.dataset.field);
                            tmp = null;
                        }

                        model.move(tmp, this.dataset.field);
                    });
                }, this);
            }
        }

    }());

    return function (el) {
        var model = new Model(),
            view = new View(el, model);
                   
            model.on("field:change", view.renderField, view);
            model.on("fields:change", view.renderFields, view);
            model.on("piece:calculatePossibleMoves", view.renderPossibleMoves, view);
            
        
            view.on("piece:choose", null);
            view.on("piece:move", null);
            view.on("action:giveUp", null);
            view.on("action:startNew", null);
            
            view.init();
            
            return model;
    }
    
//    model.move('A2', 'A4');
    
}(window));

//(function (win) {
//    
//    var doc = win.document,
//        loc = win.location,
//        chess = new Chess(doc.querySelector('#chessboard table'));
//    
//}(window));


var chess = new Chess(document.querySelector('#chessboard table'));

