// Copied from http://labs.phaser.io/view.html?src=src\games\breakout\breakout.js
var Breakout = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function Breakout ()
    {
        Phaser.Scene.call(this, { key: 'breakout' });

        this.bricks;
        this.paddle;
        this.ball;
    },

    preload: function ()
    {
        this.load.atlas('assets', 'assets/breakout.png', 'assets/breakout.json');
        this.load.image('face', 'assets/bw-face.png');
    },

    create: function ()
    {
        this.add.image(400,300,'face');
        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
        });

        this.ball = this.physics.add.image(400, 500, 'assets', 'ball1').setCollideWorldBounds(true).setBounce(1);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1').setImmovable();

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

        //  Input events
        this.input.on('pointermove', function (pointer) {

            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle'))
            {
                this.ball.x = this.paddle.x;
            }

        }, this);

        this.input.on('pointerup', function (pointer) {

            if (this.ball.getData('onPaddle'))
            {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }

        }, this);

        // ### Set up pipelines ###
        this.t = 0; // time variable for the distor shader
        this.tIncrement = 0.005;
        this.spotRadius = 0.3; // size of the spotlight in the spotlight shader
        this.distortPipeline = this.game.renderer.addPipeline('Distort', new DistortPipeline(this.game));
        // Pass the game resolution to the shader to use for position-based computations
        this.distortPipeline.setFloat2('resolution', this.game.config.width, this.game.config.height);
        this.grayscalePipeline = this.game.renderer.addPipeline('Grayscale', new GrayscalePipeline(this.game));
        this.spotlightPipeline = this.game.renderer.addPipeline('Spotlight', new SpotlightPipeline(this.game));
        this.spotlightPipeline.setFloat2('resolution', this.game.config.width, this.game.config.height);
        // This object keeps track of which shader is currently in use
        this.renderMode = {
            none: false,
            distort: true,
            gray: false,
            spotlight: false
        }
        this.applyPipeline(); 
        
        this.createGUI();
    },

    // Apply the shader currently marked as true in `renderMode`
    applyPipeline: function(){
        if(this.renderMode.distort){
            this.cameras.main.setRenderToTexture(this.distortPipeline);
        }else if(this.renderMode.gray){
            this.cameras.main.setRenderToTexture(this.grayscalePipeline);
        }else if(this.renderMode.spotlight){
            this.spotlightPipeline.setFloat1('r',this.spotRadius);
            this.cameras.main.setRenderToTexture(this.spotlightPipeline);
        }else if(this.renderMode.none){
            this.cameras.main.clearRenderToTexture();
        }
    },

    createGUI: function(){
        var _this = this;
        var gui = new dat.GUI({ width: 300 });
        gui.add(this.renderMode, "none").name('No shader').listen().onChange(function(){
            this.changeMode("none");
        }.bind(this));
        gui.add(this.renderMode, "distort").name('Distortion').listen().onChange(function(){
            this.changeMode("distort");
        }.bind(this));
        gui.add(this,"tIncrement").name("Distortion intensity").min(0).max(0.1).step(0.005);
        gui.add(this.renderMode, "gray").name('Grayscale').listen().onChange(function(){
            this.changeMode("gray");
        }.bind(this));
        gui.add(this.renderMode, "spotlight").name('Spotlight').listen().onChange(function(){
            this.changeMode("spotlight");
        }.bind(this));
        gui.add(this,"spotRadius").name("Spotlight radius").min(0).max(1).step(0.1).onChange(function(){
            this.spotlightPipeline.setFloat1('r',this.spotRadius);
        }.bind(this));
    },

    changeMode: function(m){
        for(var mode in this.renderMode){
            this.renderMode[mode] = false;
        }
        this.renderMode[m] = true;
        this.applyPipeline();
    },

    hitBrick: function (ball, brick)
    {
        brick.disableBody(true, true);

        if (this.bricks.countActive() === 0)
        {
            this.resetLevel();
        }
    },

    resetBall: function ()
    {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);
    },

    resetLevel: function ()
    {
        this.resetBall();

        this.bricks.children.each(function (brick) {

            brick.enableBody(false, 0, 0, true, true);

        });
    },

    hitPaddle: function (ball, paddle)
    {
        var diff = 0;

        if (ball.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    },

    update: function ()
    {
        if (this.ball.y > 600)
        {
            this.resetBall();
        }
        // Update pipeline temporal aspect
        this.t += this.tIncrement;    
        if(this.renderMode.distort) this.distortPipeline.setFloat1('time', this.t);
        if(this.renderMode.spotlight){
            // Set the position of the spotlight to be the same as the position of the ball
            this.spotlightPipeline.setFloat1('tx', this.ball.x/this.game.config.width);
            this.spotlightPipeline.setFloat1('ty', 1-(this.ball.y/this.game.config.height));
        }
    }

});

var config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    scene: [ Breakout ],
    physics: {
        default: 'arcade'
    }
};

var game = new Phaser.Game(config);
