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
        
        FIELDS = {
            A1: 0, A2: 1, A3: 2, A4: 3, A5: 4, A6: 5, A7: 6, A8: 7,
            B1: 8, B2: 9, B3: 10, B4: 11, B5: 12, B6: 13, B7: 14, B8: 15,
            C1: 16, C2: 17, C3: 18, C4: 19, C5: 20, C6: 21, C7: 22, C8: 23,
            D1: 24, D2: 25, D3: 26, D4: 27, D5: 28, D6: 29, D7: 30, D8: 31,
            E1: 32, E2: 33, E3: 34, E4: 35, E5: 36, E6: 37, E7: 38, E8: 39,
            F1: 40, F2: 41, F3: 42, F4: 43, F5: 44, F6: 45, F7: 46, F8: 47,
            G1: 48, G2: 49, G3: 50, G4: 51, G5: 52, G6: 53, G7: 54, G8: 55,
            H1: 56, H2: 57, H3: 58, H4: 59, H5: 60, H6: 61, H7: 62, H8: 63
        },
        
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
        
        strategy = {
            [PIECES.king]: function (fieldFrom, fieldTo) {},
            [PIECES.queen]: (function (fieldFrom, fieldTo) {
                var possible = [-1, -7, -8, -9, +1, +7, +8, +9];

                function checkPossibleDirection(from, to, dir) {
                    while(this.isExistsField(from+=dir)) {

                        if(tmp === to) {
                            return true;
                        }

                        if(!tmp.isEmptyField(from)) {
                            return false;
                        }
                    }

                    return false;
                }

                return function (fieldFrom, fieldTo) {
                    var from = this.getFieldIndex(fieldFrom),
                        to = this.getFieldIndex(fieldTo);

                        return possible.some(function(item) {
                            return checkPossibleDirection(from, to, item);
                        }, this);
                };
            }()),
            [PIECES.rook]: function (fieldFrom, fieldTo) {},
            [PIECES.bishop]: function (fieldFrom, fieldTo) {},
            [PIECES.knight]: function (fieldFrom, fieldTo) {},
            [PIECES.pawn]: function (fieldFrom, fieldTo) {
                return true;
            }
        };
    
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
            
            this.trigger("fields:change");
        }
        
        this.init = function () {
            this.arrangePieces();
        };
        
    };

    Model.prototype.getFieldIndex = function (field) {
        return (typeof field).toLowerCase() === 'number' ? field : FIELDS[field];
    };

    Model.prototype.getField = function (field) {
        return this.fields[this.getFieldIndex(field)];
    };

    Model.prototype.isEmptyField = function (field) {
        return (this.getField(field) & ~MASK.empty) === 0;
    };

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
        
        this.trigger("fields:change");
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

    Model.prototype.move = function (from, to) {
        if(this.isEmptyField(from)) {
            return;
        }
        
        var hash = this.parseField(from);
                                
        if(!strategy[hash.piece](from, to)) {
            return;
        }
        
        this.clearFields([from, to]);
        this.fillField(to, [hash.piece, hash.color, hash.state]);
    };

    var View = (function() {
        
        var pieces = {
               [0 | PIECES.king | COLOR.white]: '&#9812',
               [0 | PIECES.queen | COLOR.white]: '&#9813',
               [0 | PIECES.rook | COLOR.white]: '&#9814',
               [0 | PIECES.bishop | COLOR.white]: '&#9815',
               [0 | PIECES.knight | COLOR.white]: '&#9816',
               [0 | PIECES.pawn | COLOR.white]: '&#9817',
               [0 | PIECES.king | COLOR.black]: '&#9818',
               [0 | PIECES.queen | COLOR.black]: '&#9819',
               [0 | PIECES.rook | COLOR.black]: '&#9820',
               [0 | PIECES.bishop | COLOR.black]: '&#9821',
               [0 | PIECES.knight | COLOR.black]: '&#9822',
               [0 | PIECES.pawn | COLOR.black]: '&#9823'
            },
            tpl = {
                
            }
        
        return function (el, model) {
            Base.call(this);

            this.el = el;
            
            this.fields = el.querySelectorAll('td');

            this.renderChessBoard = function(field) {
                model.fields.forEach(function(item, index) {
                    if((item & MASK.field) == FIELD.black) {
                        this.fields[index].classList.add('field-black');
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
            
            this.render = function() {
                model.fields.forEach(function(item, index) {
                    this.renderField(index);
                }, this);
            }

            this.init = function() {
                this.renderChessBoard();
                
                model.init();
            }
        }
        
    }());

    return function (el) {
        var model = new Model(),
            view = new View(el, model);
                   
            model.on("field:change", view.renderField, view);
            model.on("fields:change", view.render, view);
        
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

