//find minimum of width/length of window to make a square a svg
var minlength = Math.min(window.innerWidth,window.innerHeight);
var whoStarts; //0=player ,1 = computer
var availableSpots;//total spots available on board
var computerPositions;//taken positions by computer
var playerPositions;//taken positions by player
var waitForClick;//bool, on on if player's turn , off if not
var playerSymbol;//"Cross" or "Circle"
var objWinPath={//all possible winning paths given any board position
		0:[[1,2],[4,8],[3,6]],
		1:[[0,2],[4,7]],
		2:[[0,1],[5,8],[4,6]],
		3:[[0,6],[4,5]],
		4:[[0,8],[3,5],[2,6],[7,1]],
		5:[[2,8],[3,4]],
		6:[[3,0],[7,8],[4,2]],
		7:[[6,8],[4,1]],
		8:[[5,2],[6,7],[0,4]]
};
var winCount=0;//total wins by player
var lossCount=0;//total wins by computer
var drawCount=0;//total draw

 
function symbolSelect(symb){
	   //called by click from initializer, first set who goes first randomly 
	   whoStarts = [0,1][Math.floor(Math.random() * [0,1].length)];
	   //adjust click wait accordingly
	   if (whoStarts ===0){waitForClick = true;}//player starts
	   else{waitForClick = false;}
	   //store selected symbol of player and infer computer's
	   if(symb==="cellintro0"){playerSymbol="Cross";}
	   else{playerSymbol="Circle";}
	   //start game
	   gameModule('fresh');
	  }

function gameModule(caller){
//the main game module, possible calls:
//fresh = new game set
//computer = computer move finished
//player = player move finsihed
//finish = game done
//reset = after game reset
  switch(caller){
    case 'fresh':
      gameFinish('fresh');
      return;//this last return statement is important or it will screw up the callbacks
    case 'computer':
      //check if last move made by computer is a winner
      var winner = winCheck("computer");
      if(winner[0]){
    	//if winner highlight winning path and finish game
        $('#txtTurn').empty();
        drawHighlightWin(winner[1],winner[2]);
        gameFinish('Computer Win');
      }
      else{
    	//if not a winner, pass turn to player until no more spots left, aka a draw
        if (availableSpots.length===0){gameFinish('Draw');}
      }
      break;
    case 'player':
      //check if last move made by player is a winner
      var winner = winCheck("user");
      if(winner[0]){
    	//if winner highlight winning path and finish game
        $('#txtTurn').empty();
        drawHighlightWin(winner[1],winner[2]);
        gameFinish('Player Win');
      }
      else{
    	//if not a winner and spots still available pass turn back to computer otherwise finish with
    	// a draw
        if ((availableSpots.length>0) && (!waitForClick)){computerMove();}
        else{gameFinish('Draw');}
      }
      break;
    case 'reset':
      //on a soft reset pass the move to computer depending on turn and restart the cycle
      //if not computer's turn then just wait on player to make the move
      if (whoStarts===1){computerMove();}
      break;
   }   
}
function commonReset(){
  //resets soft parameters after a game and redraws grid
  availableSpots=[0,1,2,3,4,5,6,7,8];
  computerPositions=[];
  playerPositions=[];
  drawGrid();
}
function gameFinish(finishType){
  //function used to finish game off and reset for next game based on param finishtype
  if (finishType==="fresh"){//brand new game Hard reset
    commonReset();
    gameModule('reset');
  }
  else{//soft reset between games
	//set a small sleep timer with a call back function as to not abruptly end the game
    setTimeout(finishCallback,1500);
  }
  //is executed after small time out
  function finishCallback(){
      if(finishType==="Draw"){
    	//for a draw flip who starts for the next game and call gameOver
        if(whoStarts===0){whoStarts=1;waitForClick=false;}
        else{whoStarts=0;waitForClick=true;}
        drawGameOver(finishType);
      }
      else if(finishType==="Computer Win"){
    	//if computer wins will go first again and call gameOver
        whoStarts=1;
        waitForClick=false;
        drawGameOver(finishType);
      }
      else{
    	//if player wins will go first again and call gameOver
        whoStarts=0;
        waitForClick=true;
        drawGameOver(finishType);
      }
    }
}
function computerMove(){
	  //it is the computer's turn to make a move, the move will be decided by the optimizer 
	  //function
      var computerChoice = optimizer();
      //once choice is made remove from available spots and stick choice into computer positions
      //note taking the [0] position of splice because it returns an array, only need one
      computerPositions.push((availableSpots.splice(availableSpots.indexOf(computerChoice),1))[0]);
      //function called back after delay in display
      function displayCallback(){
    	  //draw circle/cross
          if (playerSymbol==="Circle"){drawCross("cell"+computerChoice,"svgMain");}
          else{drawCircle("cell"+computerChoice,"svgMain");}
          //flip back wait for player switch and call back main game Module
          waitForClick =  true;
          $('#txtTurn').empty();
          $('#txtTurn').append('Your Turn');
          gameModule('computer');
        }
      //set a small timeout for aesthetics as to not immediately place symbol on board
      setTimeout(displayCallback, 1000);
}
function userMove(cellID){
	//player's turn to make a move, for safety ensure that waitForclick is flipped on
    if (waitForClick){
      //get player's choice from cell ID that was clicked
      var userChoice = parseInt(cellID.split("cell")[1], 10);
      //again for safety make sure cell is open and not occupied
      if(availableSpots.includes(userChoice)){
        //once choice is made remove from available spots and stick choice into player's positions
        playerPositions.push((availableSpots.splice(availableSpots.indexOf(userChoice),1))[0]);
    	//draw circle/cross
        if (playerSymbol==="Circle"){drawCircle("cell"+userChoice,"svgMain");}
        else{drawCross("cell"+userChoice,"svgMain");}
        //flip off wait for player switch and call back main game Module
        waitForClick =  false;
        $('#txtTurn').empty();
        $('#txtTurn').append("Computer's Turn");
        gameModule('player');
      }
    }
}
function winCheck(player){
  //function checks if the player/computer has a winning position, param tells who is being checked
  var pos;//positions to check for win
  if (player === "user"){pos=playerPositions;}
  else{pos=computerPositions;}
  //need at least 3 positions for a winning combo
  if(pos.length<3){return [false,null];}
  //nested function for checking temp path called from below
  function matchWinner(tempath){
    for (var u=0;u<tempath.length;u++){
      //if any number is found in temp path that is not in the query position reject
      if(!pos.includes(tempath[u])){return false;}
    }
    return true;
  }
  //scan thru positions held
  for (var i=0;i<pos.length;i++){
	//scan all possible wining paths of the position
    for(var j=0;j<objWinPath[pos[i]].length;j++){
      //construct a temporary path
      var tempPath = [pos[i],objWinPath[pos[i]][j][0],objWinPath[pos[i]][j][1]];
      //test temppath against query positions for a win
      if(matchWinner(tempPath)){return [true,tempPath,player];}
    }
  }
  return [false,null];
}
function winKey(sentFor){
  //this function is similar to above (maybe I can combine in the future) main difference is 
  //instead of looking for a winning combo it looks for a key that will result in a win given
  //a pair of positions
  var config;//positions to look for a matching key
  if (sentFor==="computer"){config = computerPositions;}
  else{config = playerPositions;}
  //internal function checks if a specific win path matches with fiven position
  function winBlock(winpath){
	for (var j=0;j<winpath.length;j++){
		//if any one component of winpath is not found in query then reject match 
		if(!config.includes(winpath[j])){return false;}
	}
	return true;
  }
  //scan thru win path properties
  for (var property in objWinPath) {
    if (objWinPath.hasOwnProperty(property)) {
    	//capture winpath for given position
        var winpaths = objWinPath[property];
        //scan thru all possible winpaths
        for (var i=0;i<winpaths.length;i++){
          //IMPORTANT : the Object Keys are stored as a string must change into
          //number to properly compare with query!!!
          //call internal function winBlock to check if any of the win paths match with query
          if (winBlock(winpaths[i])){
        	  //if match found then check if corresponding key is not already taken and send
        	  if(availableSpots.includes(parseInt(property,10))){return [true,parseInt(property,10)];}
        	  }
        }
    }
  }

  return [false,null];
}
function optimizer(){
  //looks for best possible move for computer to make
  //basically converted instructions from here http://www.wikihow.com/Win-at-Tic-Tac-Toe; to algo
  //start with how many spots are left on the board, number of spots left tell you who went first
  switch(availableSpots.length){
  	//cases for [9,7,5,3,1] --> computer went first,
    case 9://computer's first move
      //simply return any random corner
      return [0,2,6,8][Math.floor(Math.random() * [0,2,6,8].length)];
    case 7://computer's second move
      if(playerPositions[0]===4){//player's first move has center position
        //find opposite corner of computer's first position and return
        if (computerPositions[0]===0){return 8;}
        if (computerPositions[0]===2){return 6;}
        if (computerPositions[0]===6){return 2;}
        if (computerPositions[0]===8){return 0;}
      }
      else{//player's first move was edge or corner
        var availableCornerSpots = [0,2,6,8];
        //take out original corner spot taken in first move
        availableCornerSpots.splice(availableCornerSpots.indexOf(computerPositions[0]),1);
        //if player's first move has a corner position then
        if ([0,2,6,8].includes(playerPositions[0])){
          //take that out also from the corners and return a remaining random corner
          availableCornerSpots.splice(availableCornerSpots.indexOf(playerPositions[0]),1);
          return availableCornerSpots[Math.floor(Math.random() * availableCornerSpots.length)];
        }
        else{//player's first move was an edge
          //find a corner that makes an empty space with the prior computer's move 
          var exclusivePair;
          //meaning these are the corner pairs that need to be avoided depending on player's 
          //first move
          if (playerPositions[0]===1){exclusivePair=[0,2];}
          if (playerPositions[0]===3){exclusivePair=[0,6];}
          if (playerPositions[0]===7){exclusivePair=[6,8];}
          if (playerPositions[0]===5){exclusivePair=[2,8];}
          //if any corner is found that avoids both those pairs then return
          for (var i=0;i<availableCornerSpots.length;i++){
            if((availableCornerSpots[i]!==exclusivePair[0])&&(availableCornerSpots[i]!==exclusivePair[1])){return availableCornerSpots[i];}
          }
        }
      }
    break;	
    case 5://computer's third move
      //time to check for block/winning moves, 
      var isComputerWinner = winKey("computer");
      var isPlayerWinner = winKey("player");
      //first check if computer is a winner, if so then send winning key
      if(isComputerWinner[0]){return isComputerWinner[1];}
      //if however player is a winner then send blocking key
      else if(isPlayerWinner[0]){return isPlayerWinner[1];}
      //if no winners then carefully pick one of the 2 remaining corner spots
      else{
          var remainingCorners=[];
          for (var i=0;i<availableSpots.length;i++){
            if([0,2,6,8].includes(availableSpots[i])){remainingCorners.push(availableSpots[i])}
          }
          //by this time only 2 corners will be remaining, choose one that is inline 
          //to the other corner and has no obstruction
          for (var k=0;k<remainingCorners.length;k++){
        	//manually check each corner for obstruction
            if(remainingCorners[k]===0){
              if(availableSpots.includes(1)&&availableSpots.includes(3)){return 0;}
            }
            else if(remainingCorners[k]===6){
              if(availableSpots.includes(3)&&availableSpots.includes(7)){return 6;}
            }
            else if(remainingCorners[k]===8){
              if(availableSpots.includes(5)&&availableSpots.includes(7)){return 8;}
            }
            else{
              if(availableSpots.includes(5)&&availableSpots.includes(1)){return 2;}
            }
          }
        }
    break;
    case 3://computers 4th move
      var isComputerWinner = winKey("computer");
      var isPlayerWinner = winKey("player");
      //if computer is a winner then send winning key
      if(isComputerWinner[0]){return isComputerWinner[1];}
      //if player is a winner then block
      else if(isPlayerWinner[0]){return isPlayerWinner[1];}
      else{//just for safety
        return availableSpots[Math.floor(Math.random() * availableSpots.length)];
      }
    break;
    // [8,6,4,2] --> player went first
    case 8://computer's 1st move
      //send corner or center depending on 1st move
      if(playerPositions[0]===4){return [0,2,6,8][Math.floor(Math.random() * [0,2,6,8].length)];}
      else{return 4;}
    break;
    case 6://computer's 2nd move
      //first attempt to block any possible winning paths of player
      var isPlayerWinner = winKey("player");
      if(isPlayerWinner[0]){return isPlayerWinner[1];}
      //next check if first player move was a corner , if so pick any free edge
      else if ([0,2,6,8].includes(playerPositions[0])){
        var edges = [1,3,7,5];
        for (var i=0;i<edges.length;i++){
          var randEdgeSpot = edges[Math.floor(Math.random() * edges.length)];
          if (availableSpots.includes(randEdgeSpot)){return randEdgeSpot;}
        }
      }
      //if none of the above check if first player move was an edge
       else if ([1,3,7,5].includes(playerPositions[0])){
         //check if second edge position of player is opposite of first edge
         var oppCheckA= [1,7].includes(playerPositions[0])&&[1,7].includes(playerPositions[1])
         var oppCheckB= [3,5].includes(playerPositions[0])&&[3,5].includes(playerPositions[1])
         //if so find a free corner and send
         if((oppCheckA)||(oppCheckB)){
           var corners = [0,2,6,8];
           for (var i=0;i<corners.length;i++){
             if (availableSpots.includes(corners[i])){return corners[i];}
           }
         }
         else{return availableSpots[Math.floor(Math.random() * availableSpots.length)];}
        }
        //for safety
       else{return availableSpots[Math.floor(Math.random() * availableSpots.length)];}
    break;
    case 4://compter's 3rd move 
      //just run win/block routines
      var isComputerWinner = winKey("computer");
      var isPlayerWinner = winKey("player");
      //if computer is a winner then send winning key
      if(isComputerWinner[0]){return isComputerWinner[1];}
      //if player is a winner then block
      else if(isPlayerWinner[0]){return isPlayerWinner[1];}
      else{return availableSpots[Math.floor(Math.random() * availableSpots.length)];}
    break;
    case 2://compter's 4th move
      //just run win/block routines
      var isComputerWinner = winKey("computer");
      var isPlayerWinner = winKey("player");
      //if computer is a winner then send winning key
      if(isComputerWinner[0]){return isComputerWinner[1];}
      //if player is a winner then block
      else if(isPlayerWinner[0]){return isPlayerWinner[1];}
      else{return availableSpots[Math.floor(Math.random() * availableSpots.length)];}
    break;
    default:
      return availableSpots[Math.floor(Math.random() * availableSpots.length)];
  }
}
//****---all functions below are fo drawings/svg interactions----******
function SVG(tag) {
	//IMPORTANT can not create svg element without this function
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}
function drawScoreBoard(){
  //draws score board beneath cells
  var mainSquareLength = minlength*0.895;
  var svgConstruction = "<svg version=\"1.1\" baseProfile=\"full\" id=\"svgScore\" width=" + mainSquareLength.toString() + " height=" + ((mainSquareLength)/10).toString()+ " xmlns=\"http://www.w3.org/2000/svg\"></svg>";
  $('#main').append(svgConstruction);
  $("#svgScore").hide();
  var group = SVG('g');//use group to group text and rect together
  $('#svgScore').append(group);
  $(group).attr("id","scoreParent")
          .attr("width","100%")
          .attr("height","100%");
  var scoreHolderRect = SVG('rect');
  $(scoreHolderRect) .attr("id","scoreBoard")
                    .attr("x","0")
                    .attr("y","0")
                    .attr("width","100%")
                    .attr("height","100%")
                    .attr("fill","white")
                    .attr("stroke-width","5");
  //optimize font size based on screen dims
  var respFontsize = (mainSquareLength*0.05).toString()+"px"
  var winField =SVG('text');//wins text
  $(winField).attr("id","txtWin")
            .attr("x","2%")
            .attr("y","70%")
            .attr("font-family","Pacifico")
            .attr("font-size",respFontsize)
            .attr("fill","green")
  var lossField =SVG('text');//losses text
  $(lossField).attr("id","txtLoss")
              .attr("x","20%")
              .attr("y","70%")
              .attr("font-family","Pacifico")
              .attr("font-size",respFontsize)
              .attr("fill","red")
  var drawField =SVG('text');//draw text
  $(drawField).attr("id","txtDraw")
              .attr("x","35%")
              .attr("y","70%")
              .attr("font-family","Pacifico")
              .attr("font-size",respFontsize)
              .attr("fill","#af8103")
  var turnField =SVG('text');//next turn text
  $(turnField).attr("id","txtTurn")
              .attr("x","50%")
              .attr("y","70%")
              .attr("font-family","Pacifico")
              .attr("font-size",respFontsize)
              .attr("fill","blue")
  var restartField =SVG('text');//restart button 
  $(restartField).attr("id","txtRestart")
              .attr("x","92%")
              .attr("y","70%")
              .attr("font-family","fontAwesome")
              .attr("font-size",(mainSquareLength*0.07).toString()+"px")
              .attr("fill","red")
              .attr("onclick","window.location.href=window.location.href")//simply reload page if restart requested
              .attr("cursor","pointer");
  var win="W:"+winCount;
  var loss="L:"+lossCount;
  var draw="D:"+drawCount;
  var turn;
  if(waitForClick){
	  turn ="Your Turn";
  }
  else{
      turn ="Computer's Turn";
  }
  $(group).append(scoreHolderRect);
  $(group).append($(winField).append(win));
  $(group).append($(lossField).append(loss));
  $(group).append($(drawField).append(draw));
  $(group).append($(turnField).append(turn));
  $(group).append($(restartField).append("\uf00d"));
  $("#svgScore").fadeIn(2000);
}
function drawGameOver(finishType){
  //displays info screen for when a game is over
  $('#info').hide();
  $('#svgScore').fadeOut(1000)
  $('#svgMain').fadeOut(1000,function(){
    var mainSquareLength = minlength*0.5;//proprtion to window size
    var svgConstruction = "<svg version=\"1.1\" baseProfile=\"full\" id=\"svgGameOver\" width=" + mainSquareLength.toString() + " height=" + mainSquareLength.toString()+ " xmlns=\"http://www.w3.org/2000/svg\"></svg>"
    $('#main').append(svgConstruction);
    var group = SVG('g');
    $('#svgGameOver').append(group)
    $(group).attr("id","parent");
    var textHolderRect = SVG('rect');
    $(textHolderRect) .attr("id","gameover")
                      .attr("x","0")
                      .attr("y","0")
                      .attr("rx","5%")
                      .attr("ry","5%")
                      .attr("width","100%")
                      .attr("height","100%")
                      .attr("fill","white")
                      .attr("stroke-width","5");
    var messageField =SVG('text');
    var respFontsize = (mainSquareLength*0.15).toString()+"px";
    $(messageField).attr("id","winloss")
              .attr("x","10%")
              .attr("y","50%")
              .attr("font-family","Pacifico")
              .attr("font-size",respFontsize)
    //draw messages depending on finish type
    var message;
    if(finishType==="Draw"){
    message= "It is a Draw!";
      $(messageField).attr("fill","#af8103");
      drawCount++;
    }
    else if(finishType==="Computer Win"){
      message = "You Loose!";
      $(messageField).attr("fill","red");
      lossCount++;
    }
    else{
      message = "You Win!";
      $(messageField).attr("fill","green")
      winCount++;
    }
    $(messageField).append(message);
    $(group).append(textHolderRect);
    $(group).append(messageField);
    $(group).hide();
    //have a small transition before calling reset
    $(group).fadeIn(3000, function(){
      commonReset();
      gameModule('reset');
    });
  })//can't set fade outs together due to call back??
}
function drawHighlightWin(winCells,player){
  //flashes winner if winning combo found given the player and winning combo cells
  for (var i=0;i<winCells.length;i++){
    var winCell=document.getElementById("cell"+winCells[i]);
    if (player==="user"){//if player flash with green
      $(winCell).attr("fill","green")
    }
    else{//if computer flash with red
      $(winCell).attr("fill","red")
    }
    var flashlength = 200;
    $(winCell).fadeIn(flashlength).fadeOut(flashlength).fadeIn(flashlength).fadeOut(flashlength).fadeIn(flashlength);
  }
}
function drawCircle(cellID,svgID){
  //draws a circle using svg circle, given the cellID and svg ID
  var elemDims=document.getElementById(cellID).getBBox();
  var centerX = elemDims.x + elemDims.width/2;
  var centerY = elemDims.y + elemDims.height/2;
  var elementalcirc = SVG('circle');
  $(elementalcirc).attr("id","circle"+cellID)
                  .attr("cx",centerX.toString())
                  .attr("cy",centerY.toString())
                  .attr("r","14%")
                  .attr("stroke","black")
                  .attr("stroke-width",(minlength/90).toString())
                  .attr("fill","none");
  $('#'+svgID).append(elementalcirc);
}
function drawCross(cellID,svgID){
  //draws a cross using svg path, given the cellID and svg ID
  var checkElem = document.getElementById(svgID);
  var elemDims=document.getElementById(cellID).getBBox();
  var offset = .2; //so that cross will not overlap with rect boundary
  var upperLeftX = elemDims.x + (offset*elemDims.width);
  var upperLeftY = elemDims.y + (offset*elemDims.width);
  var lowerRightX= (elemDims.x + elemDims.width) - (offset*elemDims.width);
  var lowerRightY= (elemDims.y + elemDims.height) - (offset*elemDims.width);
  
  var lowerLeftX = elemDims.x + (offset*elemDims.width);
  var lowerLeftY = (elemDims.y + elemDims.height) - (offset*elemDims.width);
  var upperRightX= (elemDims.x + elemDims.width) - (offset*elemDims.width);
  var upperRightY= elemDims.y + (offset*elemDims.width);
  
  var elementalcross = SVG('path');
  $(elementalcross).attr("id","cross"+cellID)
                   .attr("d","M "+upperLeftX + " " + upperLeftY + " L " + lowerRightX + " " + lowerRightY + " M " + lowerLeftX + " " + lowerLeftY + " L " + upperRightX + " " + upperRightY)
                   .attr("stroke","black")
                   .attr("stroke-width",(minlength/90).toString())
                   .attr("fill-opacity","0");
  $("#"+svgID).append(elementalcross);
}
function drawGrid(){
  //draws main grid
  $('#main').empty();
  //proprtion square to window size
  var mainSquareLength = minlength*0.9;
  var svgConstruction = "<svg version=\"1.1\" baseProfile=\"full\" id=\"svgMain\" width=" + mainSquareLength.toString() + " height=" + mainSquareLength.toString()+ " xmlns=\"http://www.w3.org/2000/svg\"></svg>";
  $('#main').append(svgConstruction);
  $('#svgMain').hide();
  //set y coordinates before starting iteration 
  var yDist = 200/3;
  var idgen=0;//used to identify each cell
  //loop thru 3 columns
  for(var i=0;i<3;i++){
    var xDist = 0;
    //and then 3 rows
    for(var j=0;j<3;j++){
        var elementalRect = SVG('rect');
        var cellID = "cell"+idgen;
        //add an onclick attribute to call user move function
        var clickConstruct = "userMove("+"\""+cellID+"\")";
        $(elementalRect).attr("id",cellID)
                        .attr("x",xDist.toString()+"%")
                        .attr("y",yDist.toString()+"%")
                        .attr("width",(100/3).toString()+"%")
                        .attr("height",(100/3).toString()+"%")
                        .attr("fill","white")
                        .attr("stroke","black")
                        .attr("stroke-width",(minlength/90).toString())
                        .attr("onclick",clickConstruct);
        xDist += (100/3);   
        idgen++;
        $('#svgMain').append(elementalRect);
    }
    yDist -= (100/3);
  }
  $('#svgMain').fadeIn(2000);
  $('#info').show();
  //draw score board beneath grid
  drawScoreBoard();
}
function drawInitializer(){
  //draws initial screen to pick symbol
  $('#main').empty();
  //adjust SVG size wrt screen size
  var mainSquareLength = minlength*0.8;
  var svgConstruction = "<svg version=\"1.1\" baseProfile=\"full\" id=\"svgintro\" width=" + mainSquareLength.toString() + " height=" + mainSquareLength.toString()+ " xmlns=\"http://www.w3.org/2000/svg\"></svg>";
  $('#main').append(svgConstruction);
  //group used for grouping the text and symbols
  var group = SVG('g');
  $('svg').append(group);
  $(group).attr("id","parent");
  //create rectangle and add attributes
  var textHolderRect = SVG('rect');
  $(textHolderRect).attr("id","gameinitial")
                   .attr("x","0")
                   .attr("y","0")
                   .attr("rx","5%")
                   .attr("ry","5%")
                   .attr("width","100%")
                   .attr("height","100%")
                   .attr("fill","white")
                   .attr("stroke-width","5");
  //add intro text , adjust font-size + attributes
  var messageField =SVG('text');
  var respFontsize = (mainSquareLength*0.085).toString()+"px";
  $(messageField).attr("id","intro")
                 .attr("x","13%")
                 .attr("y","20%")
                 .attr("font-family","Pacifico")
                 .attr("font-size",respFontsize);
  $(messageField).attr("fill","black");
  $(messageField).append("Choose Your Symbol");
  $(group).append(textHolderRect);
  $(group).append(messageField);
  //create rectangles for symbol in same way as created for grid (look @ drawGrid)
  var xDist=10;
  for(var j=0;j<2;j++){
		var elementalRect = SVG('rect');
		var cellID = "cellintro"+j;
		//note, click will call symbolSelect function that will start game
		var clickConstruct = "symbolSelect("+"\""+cellID+"\")";
		$(elementalRect).attr("id",cellID)
		  .attr("x",xDist.toString()+"%")
		  .attr("y","45%")
		  .attr("width",(100/3).toString()+"%")
		  .attr("height",(100/3).toString()+"%")
		  .attr("fill","white")
		  .attr("stroke","white")
		  .attr("stroke-width","5")
		  .attr("onclick",clickConstruct)//if clicked symbol selected and game started
		  .attr("cursor","pointer");
		xDist += (100/2);   
		$(group).append(elementalRect);
  }
  //draw symbols using same functions as game drawing
  drawCross("cellintro0","svgintro");
  drawCircle("cellintro1","svgintro");
  $(group).hide();
  //small animation effect on intro for aesthetics
  $(group).fadeIn(3000);
}

$(document).ready(function() {
  drawInitializer();
});