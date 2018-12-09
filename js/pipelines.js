
var GrayscalePipeline = new Phaser.Class({

    Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,

    initialize:

    function GrayscalePipeline (game)
    {
        Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
            game: game,
            renderer: game.renderer,
            fragShader: [
                "precision mediump float;",
                "uniform sampler2D uMainSampler;",
                "varying vec2 outTexCoord;",
                "void main(void) {",
                "vec4 color = texture2D(uMainSampler, outTexCoord);",
                "float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));",
                "gl_FragColor = vec4(vec3(gray), 1.0);",
                "}",
            ].join('\n')
        });
    } 
});

// ###################################"

var DistortPipeline = new Phaser.Class({

    Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,

    initialize:

    function DistortPipeline (game)
    {
        Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
            game: game,
            renderer: game.renderer,
            fragShader: [
            "precision mediump float;",

            "uniform float     time;",
            "uniform vec2      resolution;",
            "uniform sampler2D uMainSampler;",
            "varying vec2 outTexCoord;",

            "void main( void ) {",

                "vec2 uv = outTexCoord;",
                "//uv.y *= -1.0;",
                "uv.y += (sin((uv.x + (time * 0.5)) * 10.0) * 0.1) + (sin((uv.x + (time * 0.2)) * 32.0) * 0.01);",
                "vec4 texColor = texture2D(uMainSampler, uv);",
                "gl_FragColor = texColor;",

            "}"
            ].join('\n')
        });
    } 

});

// ##########################"



var SpotlightPipeline = new Phaser.Class({

    Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,

    initialize:

    function SpotlightPipeline (game)
    {
        Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
            game: game,
            renderer: game.renderer,
            fragShader: [
                "precision mediump float;",
                "uniform vec2  resolution;",
                "uniform float tx;",
                "uniform float ty;",
                "uniform float r;",
                "uniform sampler2D uMainSampler;",
                "varying vec2 outTexCoord;",
                "vec3 makeCircle(vec2 st,vec2 center, vec3 col){",
                    "float d = distance(st,center);",
                    "float pct = smoothstep(r,r+0.1,d);",
                    "return vec3(1.0-pct)*col;",
                "}", 
                "void main(void) {",
                    "vec2 st = vec2(gl_FragCoord.x/resolution.x,gl_FragCoord.y/resolution.y);",
                    "vec4 color = texture2D(uMainSampler, outTexCoord);",
                    "gl_FragColor = color*vec4(makeCircle(st,vec2(tx,ty),vec3(1.0)),1.0);",
                "}",
            ].join('\n')
        });
    } 

});