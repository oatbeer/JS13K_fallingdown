(function(){
    // use this shim for smooth animation
    var requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    /**
     * Setting up the canvas
     */
    var c = document.getElementById("c");
    var ctx = c.getContext("2d");
    var canvasWidth = 640, canvasHeight = 920, gameLoop, points = 0, state = true, requestId = 0, starttime;
    c.width = canvasWidth;
    c.height = canvasHeight;

    /**
     * Clear canvas
     */
    var clear = function(){
        var myGradient = ctx.createLinearGradient(0, c.height, 0, 0);
        myGradient.addColorStop(0, "#D84800");
        myGradient.addColorStop(1, "#FFA475");
        ctx.fillStyle = myGradient;
        ctx.beginPath();
        ctx.rect(0, 0, c.width, c.height);
        ctx.closePath();
        ctx.fill();
    };
    
    /**
     * Cloud-making
     */
    var cloudNumber = 10;
    var clouds = [];

    for(var i = 0; i < cloudNumber; i++){
        clouds.push([Math.random() * c.width,
                     Math.random() * c.height,
                     Math.random() * 100,
                     Math.random() / 2]);
    }

    var drawClouds = function(){
        for(var i = 0; i < cloudNumber; i++){
            ctx.fillStyle = "rgba(255, 255, 255, " + clouds[i][3] + ")";
            ctx.beginPath();
            ctx.arc(clouds[i][0], clouds[i][1], clouds[i][2], 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.shadowBlur = 20;
            ctx.shadowColor = "white";
            ctx.fill();
            ctx.shadowColor = "transparent";
        }
    };

    var moveClouds = function(dY){
        for(var i = 0; i < cloudNumber; i++){
            if(clouds[i][1] + clouds[i][2] < 0){
                clouds[i][0] = Math.random() * c.width;
                clouds[i][2] = Math.random() * 100;
                clouds[i][1] = c.height + clouds[i][2];
                clouds[i][3] = Math.random() / 2;
            } else {
                clouds[i][1] -= dY;
           } 
        }
    };

    /**
     * Player 
     */
    var player = new (function(){
        var _this = this;

        _this.image = new Image();
        _this.image.src = 'img/player.png';

        _this.width = 32;
        _this.height = 32;

        _this.X = 0;
        _this.Y = 0;

        _this.frames = 1;
        _this.actualFrame = 0;

        _this.interval = 0;

        _this.isJumping = false;
        _this.isFalling = false;

        _this.jumpSpeed = 0;
        _this.fallSpeed = 0;
        
        _this.setPosition = function(x, y){
            _this.X = x;
            _this.Y = y;
        };

        _this.draw = function(){
            try {
                ctx.shadowBlur = 5;
                ctx.shadowColor = "white";
                ctx.drawImage(_this.image, _this.width * _this.actualFrame, 0, _this.width, _this.height, _this.X, _this.Y, _this.width, _this.height);
            } catch (e) {

            }
            ctx.shadowColor = "transparent";
        };

        /**
         * Jumping and falling
         */
        _this.jump = function(){
            if(!_this.isJumping && !_this.isFalling){
                _this.fallSpeed = 0;
                _this.isJumping = true;

                _this.jumpSpeed = 25;
            }
        };

        _this.checkJump = function(){

            if(_this.Y < c.height * 0.5){
                _this.setPosition(_this.X, _this.Y + _this.jumpSpeed);
            } else {
                if (_this.jumpSpeed > 10) {points++;} 
                moveClouds(this.jumpSpeed * 0.5);
                
                platforms.forEach(function(platform, ind){
                    platform.y -= _this.jumpSpeed;

                    if(platform.y < 0){
                        var type = ~~(Math.random() * 8);
                        if (type === 0){
                            type = 1;
                        } else {
                            type = 0;
                        }
                        platforms[ind] = new Platform(Math.random() * (c.width - platformWidth),
                                                      platform.y + c.height,
                                                      type);
                    }
                });
            }
                
            _this.jumpSpeed--;

            if(_this.jumpSpeed === 0){
                _this.isJumping = false;
                _this.isFalling = true;
                _this.fallSpeed = 1;
            }
        };

        _this.checkFall = function(){
            if(_this.Y > 0){
                _this.setPosition(_this.X, _this.Y - _this.fallSpeed);
                _this.fallSpeed += 0.5;
            } else {
                if(points === 0){
                    _this.fallStop();
                } else {
                    gameOver();
                }
            }
        };

        _this.fallStop = function(){
            _this.isFalling = false;
            _this.fallSpeed = 0;
            _this.jump();
        };

        /**
         * Controls
         */
        _this.moveLeft = function(){
            if(_this.X > 0){
                _this.setPosition(_this.X - 5, _this.Y);
            }
        };

        _this.moveRight = function(){
            if(_this.X + _this.width < c.width){
                _this.setPosition(_this.X + 5, _this.Y);
            }
        };
    })();


    /**
     * Platforms and collisions
     */
    var numPlatforms = 6,
        platforms = [],
        platformWidth = 70,
        platformHeight = 20;

    var Platform = function(x, y, type){
        var _this = this;

        _this.firstColor = "#F20000";

        _this.onCollide = function(){
            player.fallStop();
        };

        if(type === 1){
            _this.firstColor = "#AADD00";
            _this.onCollide = function(){
                player.fallStop();
                player.jumpSpeed = 50;
            };
        }

        _this.x = ~~ x;
        _this.y = y;
        _this.type = type;

        _this.isMoving = ~~(Math.random() * 2);
        _this.direction = ~~(Math.random() * 2) ? -1 : 1;

        _this.draw = function(){
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.fillStyle = _this.firstColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "black";
            ctx.fillRect(_this.x, _this.y, platformWidth, platformHeight);
            ctx.shadowColor = "transparent";
        };

        return _this;
    };

    var generatePlatforms = function(){
        var position = c.height - platformHeight,
            type;
        
        for(var i = 0; i < numPlatforms; i++){
            type = ~~((Math.random() * 5));
            if(type === 0){
                type = 1;
            } else {
                type = 0;
            }

            platforms[i] = new Platform(Math.random() * (c.width - platformWidth), position, type);
            if(position > 0){
                position -= ~~(c.height / numPlatforms);
            }
        }
    }();

    var checkCollision = function(){
        platforms.forEach(function(e, ind){
            if((player.isFalling) &&
               (player.X < e.x + platformWidth) &&
               (player.X + player.width > e.x) &&
               (player.Y < e.y + platformHeight) &&
               (player.Y > e.y)
              ){
                e.onCollide();
            }
        });
    };

    /**
     * Setup
     */
    
    player.setPosition(~~((c.width - player.width)), ~~((0 + player.X)));

    document.onmousemove = function(e){
        if(player.X + c.offsetLeft > e.pageX){
            player.moveLeft();
        } else if(player.X + c.offsetLeft < e.pageX){
            player.moveRight();            
        }
    };

    c.onclick = function(e){
        player.jump();
    };
    
    /**
     * Game loop
     */
    var animate = function(){
        
        clear();
        drawClouds();
        moveClouds(1);

        if(player.isJumping) player.checkJump();
        if(player.isFalling) player.checkFall();
     
        player.draw();

        platforms.forEach(function(platform, index){
            if (platform.isMoving){
                if(platform.x < 0){
                    platform.direction = 1;
                } else if (platform.x > c.width - platformWidth){
                    platform.direction = -1;
                }

                platform.x += platform.direction * (index / 2) * ~~(points / 100);
            }
            platform.draw();
        });

        checkCollision();
        
        ctx.fillStyle = "white";
        ctx.font = "bold 14pt Arial";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "white";
        ctx.fillText("POINTS: " + points, 10, c.height - 10);
        
        if (state){
            gameLoop = requestAnimFrame( animate );
        }
    };

    var gameOver = function(){
        state = false;
        window.cancelAnimationFrame(gameLoop);

        setTimeout(function(){
            ctx.fillStyle = "Black";
            ctx.beginPath();
            ctx.rect(0, 0, c.width, c.height);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "White";
            ctx.font = "bold 16pt Arial";
            ctx.textAlign = "center";
            ctx.shadowBlur = 30;
            ctx.shadowColor = "white";
            ctx.fillText("GAME OVER", c.width / 2, c.height / 2 - 50);
            ctx.fillText("SCORE: " + points, c.width / 2, c.height / 2 - 30);
            ctx.fillText("Click to try again", c.width / 2, c.height / 2);
        }, 100);
        
        document.onclick = function(e){
            location.reload();
            state = true;
        };
    };

    animate();
    
})();
