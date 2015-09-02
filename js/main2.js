/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var Chess = (function (win) {

    var FIELD = {
            white: parseInt('10', 10),
            black: parseInt('11', 10)
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

    var FIELDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],

        PIECES = {
            king: parseInt('001', 10),
            queen: parseInt('010', 10),
            rook: parseInt('011', 10),
            bishop: parseInt('100', 10),
            knight: parseInt('101', 10),
            pawn: parseInt('110', 10)
        },

        COLOR = {
            white: parseInt('1000', 10),
            black: parseInt('0000', 10)
        },

        STATE = {
            check: parseInt('010000000', 10),
            checkmate: parseInt('100000000', 10),
            draw: parseInt('110000000', 10)
        },

        MASK = {
            field: parseInt('11', 10),
            piece: parseInt('11100', 10),
            color: parseInt('1100000', 10),
            pieceColor: parseInt('1111100', 10),
            state: parseInt('110000000', 10),
            empty: parseInt('11', 10)
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
        };
    
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

        this.rows = [1, 2, 3, 4, 5, 6, 7, 8];
        this.cols = [1, 2, 3, 4, 5, 6, 7, 8];

        this.arrangePieces = function () {
            this.clearAllFields();
        }
        
        this.init = function () {
            //this.arrangePieces();
        };
        
    };

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
        //var model = new Model(),
        //    view = new View(el, model);
        //
        //    model.on("field:change", view.renderField, view);
        //    model.on("fields:change", view.renderFields, view);
        //    model.on("piece:calculatePossibleMoves", view.renderPossibleMoves, view);
        //
        //
        //    view.on("piece:choose", null);
        //    view.on("piece:move", null);
        //    view.on("action:giveUp", null);
        //    view.on("action:startNew", null);
        //
        //    view.init();
        //
        //    return model;
    }
    
} (window));

//(function (win) {
//    
//    var doc = win.document,
//        loc = win.location,
//        chess = new Chess(doc.querySelector('#chessboard table'));
//    
//}(window));


var chess = new Chess(document.querySelector('#chessboard table'));

