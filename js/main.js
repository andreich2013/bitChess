/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var Chess = (function (win) {

    var FIELD = {
            white: 0b10,
            black: 0b11
        },
        
        FIELDS = [
            'A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8',
            'A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7',
            'A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6',
            'A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5',
            'A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4',
            'A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3',
            'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2',
            'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'
        ],
        
        PIECES = {
            king: 0b00100,
            queen: 0b01000,
            rook: 0b01100,
            bishop: 0b10000,
            knight: 0b10100,
            pawn: 0b11000
        },
        
        COLOR = {
            white: 0b1000000,
            black: 0b1100000
        },
        
        STATE = {
            check: 0b010000000,
            checkmate: 0b100000000,
            draw: 0b110000000
        },

        REVERSE = {
            field: revertHash(FIELD),
            fields: revertHash(FIELDS),
            pieces: revertHash(PIECES),
            color: revertHash(COLOR),
            state: revertHash(STATE)
        },

        MASK = {
            field: 0b11,
            piece: 0b11100,
            color: 0b1100000,
            pieceColor: 0b1111100,
            state: 0b110000000,
            empty: 0b11
        },
        
        strategy = (function() {

            var getPossibleDir = {
                    default: function (from, to, dir, hash) {
                        var value = this.fields[from+=dir],
                            bool = value === undefined ||
                                isNotPossible.default(from, dir) ||
                                ((value & ~MASK.empty) !== 0 && (value & MASK.color) == hash.color);

                        return bool ? [] : [from];
                    },
                    queen: function (from, to, dir, hash) {
                        var list = [];

                        while(this.fields[from+=dir] !== undefined) {
                            if(from === to || isNotPossible.default(from, dir)) {
                                return list;
                            }

                            if((this.fields[from] & ~MASK.empty) !== 0) {
                                if((this.fields[from] & MASK.color) != hash.color) {
                                    list.push(from)
                                }
                                return list;
                            }

                            list.push(from);
                        }

                        return list;
                    }
                },
                isNotPossible = {
                    default: (function() {
                        var _0 = [+1, -7, +9],
                            _7 = [-1, -9, +7];

                        return function (from, dir) {
                            return check(from, 7, _7, dir) || check(from, 0, _0, dir);
                        }
                    }()),
                    knight: (function() {
                        var _1 = [+10, -6],
                            _6 = [-10, +6],
                            _7 = [-17, +15, -10, +6],
                            _0 = [-15, +17, +10, -6];

                        return function (from, dir) {
                            return check(from, 1, _1, dir) || check(from, 6, _6, dir) || check(from, 7, _7, dir) || check(from, 0, _0, dir);
                        }

                    }()),
                };

            function check(data, modulo, list, dir) {
                return data % 8 == modulo && list.indexOf(dir) !== -1;
            }

            return {
                [PIECES.king]: (function () {
                    var possible = [-1, -7, -8, -9, +1, +7, +8, +9];

                    return function (fieldFrom, fieldTo, hash) {
                        var to = this.getFieldIndex(fieldTo),
                            list = [];

                        if(this.hasField(to, {color: hash.color})) {
                            return false;
                        }

                        possible.forEach(function(item) {
                            list = list.concat(getPossibleDir.default.apply(this, [this.getFieldIndex(fieldFrom), to, item, hash]));
                        }, this);

                        return list;
                    };
                }()),
                [PIECES.queen]: (function () {
                    var possible = [-1, -7, -8, -9, +1, +7, +8, +9];

                    return function (fieldFrom, fieldTo, hash) {
                        var to = this.getFieldIndex(fieldTo),
                            list = [];

                        if(this.hasField(to, {color: hash.color})) {
                            return false;
                        }

                        possible.forEach(function(item) {
                            list = list.concat(getPossibleDir.queen.apply(this, [this.getFieldIndex(fieldFrom), to, item, hash]));
                        }, this);

                        return list;
                    };
                }()),
                //(function (fieldFrom, fieldTo) {
                //    var possible = [-1, -7, -8, -9, +1, +7, +8, +9];
                //
                //    function checkPossibleDirection(from, to, dir) {
                //        while(this.isExistsField(from+=dir)) {
                //            if(from === to) {
                //                return true;
                //            }
                //
                //            if(!this.isEmptyField(from)) {
                //                return false;
                //            }
                //        }
                //
                //        return false;
                //    }
                //
                //    return function (fieldFrom, fieldTo, hash) {
                //        var to = this.getFieldIndex(fieldTo);
                //
                //        if(this.hasField(to, {color: hash.color}) || this.hasField(to, {piece: PIECES.king})) {
                //            return false;
                //        }
                //
                //        return possible.some(function(item) {
                //            return checkPossibleDirection.apply(this, [this.getFieldIndex(fieldFrom), to, item]);
                //        }, this);
                //    };
                //}()),
                [PIECES.rook]: (function () {
                    var possible = [-1, -8, +1, +8];

                    return function (fieldFrom, fieldTo, hash) {
                        var to = this.getFieldIndex(fieldTo),
                            list = [];

                        if(this.hasField(to, {color: hash.color})) {
                            return false;
                        }

                        possible.forEach(function(item) {
                            list = list.concat(getPossibleDir.queen.apply(this, [this.getFieldIndex(fieldFrom), to, item, hash]));
                        }, this);

                        return list;
                    };
                }()),
                [PIECES.bishop]: (function () {
                    var possible = [-9, -7, +7, +9];

                    return function (fieldFrom, fieldTo, hash) {
                        var to = this.getFieldIndex(fieldTo),
                            list = [];

                        if(this.hasField(to, {color: hash.color})) {
                            return false;
                        }

                        possible.forEach(function(item) {
                            list = list.concat(getPossibleDir.queen.apply(this, [this.getFieldIndex(fieldFrom), to, item, hash]));
                        }, this);

                        return list;
                    };
                }()),
                [PIECES.knight]: (function () {
                    var possible = [-17, -15, -10, -6, +6, +10, +15, +17];

                    return function (fieldFrom, fieldTo, hash) {
                        var to = this.getFieldIndex(fieldTo),
                            list = [];

                        if(this.hasField(to, {color: hash.color})) {
                            return false;
                        }

                        possible.forEach(function(item) {
                            list = list.concat(getPossibleDir.default.apply(this, [this.getFieldIndex(fieldFrom), to, item, hash]));
                        }, this);

                        return list;
                    };
                }()),
                [PIECES.pawn]: (function () {
                    var possible = {
                        [COLOR.white]: [-7, -8, -9],
                        [COLOR.black]: [+7, +8, +9]
                    };

                    return function (fieldFrom, fieldTo, hash) {
                        var to = this.getFieldIndex(fieldTo),
                            list = [];

                        if(this.hasField(to, {color: hash.color})) {
                            return false;
                        }

                        possible[hash.color].forEach(function(item) {
                            list = list.concat(getPossibleDir.default.apply(this, [this.getFieldIndex(fieldFrom), to, item, hash]));
                        }, this);

                        return list;
                    };
                }())
            };

        }());
    
    var recreateFields = (function () {
        var rows = [0, 2, 4, 6];
        
        return function (item, index) {
            var value = rows.indexOf(Math.floor(index/8)) !== -1 ? 0 : 1;
            return index % 2 === value ? FIELD.white : FIELD.black;
        };
    }());
    
    function revertHash(hash) {
        var res = {};

        for(var key in hash) {
            if(!hash.hasOwnProperty(key)) {
                continue;
            }

            res[hash[key]] = key;
        }

        return res;
    }  

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

        this.fields = Array.apply(null, new Array(64)).map(recreateFields);
        
        this.arrangePieces = function () {
            this.clearAllFields();
            
            this.fillFields(['A1', 'H1'], [PIECES.rook, COLOR.white]);
            this.fillFields(['B1', 'G1'], [PIECES.knight, COLOR.white]);
            this.fillFields(['C1', 'F1'], [PIECES.bishop, COLOR.white]);
            this.fillField('D1', [PIECES.king, COLOR.white]);
            this.fillField('E1', [PIECES.queen, COLOR.white]);
            this.fillFields(['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2'], [PIECES.pawn, COLOR.white]);
            
            this.fillFields(['A8', 'H8'], [PIECES.rook, COLOR.black]);
            this.fillFields(['B8', 'G8'], [PIECES.knight, COLOR.black]);
            this.fillFields(['C8', 'F8'], [PIECES.bishop, COLOR.black]);
            this.fillField('D8', [PIECES.queen, COLOR.black]);
            this.fillField('E8', [PIECES.king, COLOR.black]);
            this.fillFields(['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7'], [PIECES.pawn, COLOR.black]);
        }
        
        this.init = function () {
            this.arrangePieces();
            //this.fillField('E5', [PIECES.queen, COLOR.white]);
            //this.fillField('D2', [PIECES.king, COLOR.white]);
            //this.fillField('A6', [PIECES.knight, COLOR.black]);
            //this.fillField('D7', [PIECES.pawn, COLOR.black]);
            //this.fillField('E2', [PIECES.pawn, COLOR.white]);
            //this.fillField('C4', [PIECES.rook, COLOR.black]);
            //this.fillField('F3', [PIECES.bishop, COLOR.white]);
        };
        
    };

    Model.prototype.getFieldIndex = function (field) {
        return (typeof field).toLowerCase() === 'number' ? field : FIELDS.indexOf(field);
    };

    Model.prototype.getField = function (field) {
        return this.fields[this.getFieldIndex(field)];
    };

    Model.prototype.isEmptyField = function (field) {
        return (this.getField(field) & ~MASK.empty) === 0;
    };

    Model.prototype.isExistsField = function (field) {console.log(field);
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
    };

    Model.prototype.hasFieldColor = function (field, color) {
        return (this.getField(field) & MASK.color) == color;
    };

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
    };

    Model.prototype.calculatePossibleMoves = function (from, to) {
        if(this.isEmptyField(from)) {
            return;
        }
        
        var hash = this.parseField(from),
            list = strategy[hash.piece].apply(this, [from, to, hash]);
        
        this.trigger("piece:calculatePossibleMoves", list);
    }

    Model.prototype.move = function (from, to) {
        if(this.isEmptyField(from)) {
            return;
        }
        
        var hash = this.parseField(from);
        
        if(!strategy[hash.piece].apply(this, [from, to, hash])) {
            return;
        }
        
        this.clearFields([from, to]);
        this.fillField(to, [hash.piece, hash.color, hash.state]);
    };

    var View = (function() {
        
        var pieces = {};

        pieces[0 | PIECES.king | COLOR.white] = '&#9812';
        pieces[0 | PIECES.queen | COLOR.white] = '&#9813';
        pieces[0 | PIECES.rook | COLOR.white] = '&#9814';
        pieces[0 | PIECES.bishop | COLOR.white] = '&#9815';
        pieces[0 | PIECES.knight | COLOR.white] = '&#9816';
        pieces[0 | PIECES.pawn | COLOR.white] = '&#9817';
        pieces[0 | PIECES.king | COLOR.black] = '&#9818';
        pieces[0 | PIECES.queen | COLOR.black] = '&#9819';
        pieces[0 | PIECES.rook | COLOR.black] = '&#9820';
        pieces[0 | PIECES.bishop | COLOR.black] = '&#9821';
        pieces[0 | PIECES.knight | COLOR.black] = '&#9822';
        pieces[0 | PIECES.pawn | COLOR.black] = '&#9823';
        
        return function (el, model) {
            Base.call(this);

            this.el = el;
            
            this.fields = el.querySelectorAll('tbody td.field');

            this.renderChessBoard = function(field) {
                model.fields.forEach(function(item, index) {
                    var td = this.fields[index];
                    
                    td.dataset.index = index;
                    td.dataset.field = FIELDS[index];
                    
                    if((item & MASK.field) == FIELD.black) {
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
                this.renderChessBoard();
                
                model.init();
                var tmp = null;
                model.fields.forEach(function(item, index) {
                    this.fields[index].addEventListener('click', function(e) {
                        if(!tmp) {
                            model.calculatePossibleMoves(parseInt(this.dataset.index));
                            tmp = this.dataset.field;
                        } else {
                            model.move(tmp, this.dataset.field);
                            tmp = null;
                        }
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

