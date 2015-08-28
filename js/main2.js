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
        COORDS = [
            [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [1,8],
            [2,1], [2,2], [2,3], [2,4], [2,5], [2,6], [2,7], [2,8],
            [3,1], [3,2], [3,3], [3,4], [3,5], [3,6], [3,7], [3,8],
            [4,1], [4,2], [4,3], [4,4], [4,5], [4,6], [4,7], [4,8],
            [5,1], [5,2], [5,3], [5,4], [5,5], [5,6], [5,7], [5,8],
            [6,1], [6,2], [6,3], [6,4], [6,5], [6,6], [6,7], [6,8],
            [7,1], [7,2], [7,3], [7,4], [7,5], [7,6], [7,7], [7,8],
            [8,1], [8,2], [8,3], [8,4], [8,5], [8,6], [8,7], [8,8]
        ],

        FIELDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],

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

