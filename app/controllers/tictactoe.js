/*global Ember */
"use sctrict";

function displayOverlay(){
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('button').style.display = 'block';
}


Array.prototype.count = function(element){
    return this.filter(function(arrayElement){
        return element === arrayElement;
    }).length;
};

Array.prototype.indexesOf = function(element){
    let indexes = [];
    for(let i = 0; i<this.length; i++){
        if(this[i] === element){
            indexes.push(i);
        }
    }
    return indexes;
};

const searchCriteria = {
    danger : function(){
        return (this.count('X') === 2 && this.indexOf('O') === -1);
    },
    win : function(){
        return (this.count('O') === 2 && this.indexOf('X') === -1);
    },
    attack : function(){
        return (this.count('O') === 1 && this.indexOf('X') === -1);
    },
    firstAttack : function(){
        return (this.indexOf('X') === -1);
    },
    playerWins : function(){
      return (this.count('X') === 3);
    },
    compWins : function(){
      return (this.count('O') === 3);
    }
};


const search = (function(){

    function searchLines(){
        let lines = [];
        for(let i = 0; i < this.length; i++)
        {
            if(arguments[0].call(this[i])){
                lines.push(i);
            }
        }
        return lines;
    }

    function searchColumns(){
        return searchLines.call(reverseMatrix.call(this),arguments[0]);
    }

    function searchDiagonals(){
        let diagonals = [];

        const diagonal1 = getDiagonal.call(this,0,2);

        if(arguments[0].call(diagonal1)){
            diagonals.push(1);
        }

        const diagonal2 = getDiagonal.call(this,2,0);

        if(arguments[0].call(diagonal2)){
            diagonals.push(2);
        }

        return diagonals;
    }

    function getDiagonal(){
        let diagonal = [];
        diagonal.push(this[0][arguments[0]]);
        diagonal.push(this[1][1]);
        diagonal.push(this[2][arguments[1]]);
        return diagonal;
    }


    function reverseMatrix(){
        let matrixReverse = [];
        let column = [];
        for(let i = 0; i<this.length; i++){
            for(let j = 0; j<this.length; j++){
              column.push(this[j][i]);
            }
            matrixReverse.push(column);
            column = [];
        }

        return matrixReverse;
    }

    function selectLines(){
        let positions = [];
        arguments[0].forEach(function(line){
            this[line].indexesOf('_').forEach(function(index){
                const pos = {x: line, y : index};
                positions.push(pos);
            });
        },this);
        return positions;
    }

    function selectColumns(){
        let positions = selectLines.call(reverseMatrix.call(this),arguments[0]);
        let selectedPositions = [];
        positions.forEach(function(position){
            const pos = {x : position.y, y : position.x};
            selectedPositions.push(pos);
        });
        return selectedPositions;
    }

    function selectDiagonals(){
        let positions = [];
        arguments[0].forEach(function(diagonal){
            if(diagonal === 1){
                const diagonal = getDiagonal.call(this,0,2);
                const indexes = diagonal.indexesOf('_');
                if(indexes.indexOf(0) !== -1){
                    positions.push({x: 0, y: 0});
                }
                if(indexes.indexOf(2) !== -1){
                    positions.push({x: 2, y: 2});
                }
            }else if(diagonal === 2){
                const diagonal = getDiagonal.call(this,2,0);
                const indexes = diagonal.indexesOf('_');
                if(indexes.indexOf(0) !== -1){
                    positions.push({x: 0, y: 2});
                }
                if(indexes.indexOf(2) !== -1){
                    positions.push({x: 2, y: 0});
                }
            }
        }, this);
        return positions;
    }

    function winningLine(matrix,pos,criteria){
      return criteria.call(matrix[pos.x]);
    }

    function winningColumn(matrix,pos,criteria){
      return criteria.call(reverseMatrix.call(matrix)[pos.y]);
    }

    function winningDiagonal(matrix,criteria){
      return criteria.call(getDiagonal.call(matrix,0,2)) || criteria.call(getDiagonal.call(matrix,2,0));
    }

    return {

        matrixSearch : function (){

            const lines = searchLines.call(this, arguments[0]);
            const columns = searchColumns.call(this, arguments[0]);
            const diagonals = searchDiagonals.call(this, arguments[0]);

            let selectedPositions = [];

            if(lines.length > 0){
               selectedPositions.push.apply(selectedPositions,selectLines.call(this,lines));
            }

            if(columns.length > 0){
               selectedPositions.push.apply(selectedPositions,selectColumns.call(this,columns));
            }

            if(diagonals.length > 0){
                selectedPositions.push.apply(selectedPositions,selectDiagonals.call(this,diagonals));
            }

            let pos;
            if(selectedPositions.length > 0){
                pos = selectedPositions[Math.floor(Math.random()*selectedPositions.length)];
            }

            return pos;
        },
        isWin : function(matrix, pos, criteria){
            return winningLine(matrix,pos,criteria) || winningColumn(matrix,pos,criteria) || winningDiagonal(matrix,criteria);
        }
    };

})();

const play = (function(){

    let matrix = [['_','_','_'],
                ['_','_','_'],
                ['_','_','_']];

    function nextMove(){
        let pos = search.matrixSearch.call(this,searchCriteria.win);
        if(pos === undefined){
            pos = search.matrixSearch.call(this,searchCriteria.danger);
            if(pos === undefined){
                pos = search.matrixSearch.call(this,searchCriteria.attack);
                if(pos === undefined){
                   if(this[1][1] === '_'){
                        pos = {x : 1, y : 1};
                    }else{
                        pos = search.matrixSearch.call(this,searchCriteria.firstAttack);
                    }
                }
            }
        }
        return pos;
    }

    function addMatrix(){
        matrix[arguments[0]][arguments[1]] = arguments[2];
    }

    function searchWin(pos, criteria){
      return search.isWin(matrix, pos, criteria);
    }

    function cleanMatrix(){
      for(let i = 0; i<matrix.length; i++){
        for(let j = 0; j<matrix.length; j++){
          matrix[i][j] = '_';
        }
      }
    }

    return {
        restart : function(){
          cleanMatrix();
        },
        player : function(){
           addMatrix(arguments[0],arguments[1],'X');
        },
        comp : function(){
          const pos = nextMove.call(matrix);
          if(pos !== undefined){
            addMatrix(pos.x,pos.y,'O');
          }
          return pos;
        },
        playerWins : function(pos){
          return searchWin(pos, searchCriteria.playerWins);
        },
        compWins : function(pos){
          return searchWin(pos,searchCriteria.compWins);
        }
    };
})();

export default Ember.Controller.extend({
  actions : {
    select(pos){
      var posObject = JSON.parse(pos);
      play.player(posObject.x,posObject.y);
      document.querySelector('[data-index="' + posObject.x + posObject.y + '"]').classList.add("player");
      if(play.playerWins(posObject)){
        document.getElementById('overlay').innerHTML = 'Player Wins!';
        displayOverlay();
      }else{
        var posComp = play.comp();
        if(posComp !== undefined){
            document.querySelector('[data-index="' + posComp.x + posComp.y + '"]').classList.add("comp");
            if(play.compWins(posComp)){
              document.getElementById('overlay').innerHTML = 'Computer Wins!';
              displayOverlay();
            }
        }else{
          document.getElementById('overlay').innerHTML = 'It\'s a tie';
          displayOverlay();
        }
      }


    },
    restart(){
      play.restart();
      document.getElementById('overlay').style.display = 'none';
      document.getElementById('overlay').innerHTML = '';
      document.getElementById('button').style.display = 'none';
      var list = document.getElementsByClassName('square');
      for(var i = 0; i<list.length; i++){
        list[i].classList.remove("player");
        list[i].classList.remove("comp");
      }
    }
  }
});
