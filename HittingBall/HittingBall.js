function onLoad(){
    let flag = 5;
    switch(flag){
        case 1:
            main1();
            break;
        case 2:
            main2();
            break;
        case 3:
            main3();
            break;
        case 4:
            main4();
            break;
        case 5:
            main5();
            break;

    }
}

/*
// ひとつの物体
function main1(){
//モジュール設定
const {Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint} = Matter;
    //エンジンの初期化
        var engine = Engine.create();

        engine.world.gravity.y = 2.1;

        const {world} = engine;

        //表示の初期化
        var render = Render.create({
            element: document.body,
            engine: engine,
            options: {
                width: 600,
                height: 600,
                wireframes: false
            }
        });

        //器の定義
        var ground = Bodies.rectangle(300, 600, 600, 100, {
            isStatic: true,
            render: {
                fillStyle: '#666'
            }
        });
        var groundLeft = Bodies.rectangle(0, 300, 100, 600, {
            isStatic: true,
            render: {
                fillStyle: '#666'
            }
        });
        var groundRight = Bodies.rectangle(600, 300, 100, 600, {
            isStatic: true,
            render: {
                fillStyle: '#666'
            }
        });

        // 箱と表示エリアを読み込む
        World.add(world, [ground, groundLeft, groundRight]);

        //クリックイベントの定義
        document.addEventListener('click', function (event) {
            // クリック位置を取得（キャンバス内の座標）
            const rect = render.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // クリック位置に円のオブジェクトを生成

            //生成される円のサイズ範囲を指定
            const circleSizeMax = 100;
            const circleSizeMin = 10;
            const circleSize = Math.floor(Math.random() * (circleSizeMax - circleSizeMin + 1)) + circleSizeMin;

            //生成される円の色を指定
            const color = '#' + Math.floor(Math.random() * 16777215).toString(16)

            const circle = Bodies.circle(mouseX, mouseY, circleSize, {
                restitution: 0.5,
                render: {
                    fillStyle: color,
                }
            });

            // 生成したオブジェクトをワールドに追加
            World.add(world, circle);
        });


        // 実際に表示させる
        Render.run(render);

        // アニメーションの初期化
        var runner = Runner.create();

        // アニメーションを実行する
        Runner.run(runner, engine);

}

// ２つの物体
function main2(){
    //モジュール設定
        var Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite;

        //エンジンの初期化
        var engine = Engine.create();

        //表示の初期化
        var render = Render.create({
            element: document.body,
            engine: engine,
            options: {
                width: 600,
                height: 600,
                wireframes: false
            }
        });

        // 箱の定義
        var boxA = Bodies.rectangle(300, 0, 400, 40, {
            render: {
                fillStyle: '#343b81'
            },
            restitution: 1.5, //弾性を持たせる
            density: 0.001,//密度（小さいほど重い）

        });
        var boxB = Bodies.rectangle(300, 200, 80, 80, {
            render: {
                fillStyle: '#4e9851'
            },
            restitution: 1.5 //弾性を持たせる

        });

        //表示エリアの定義
        var ground = Bodies.rectangle(300, 600, 600, 100, {
            isStatic: true,
            render: {
                fillStyle: '#666'
            }
        });

        // 箱と表示エリアを読み込む
        Composite.add(engine.world, [boxA, boxB, ground]);

        // 実際に表示させる
        Render.run(render);

        // アニメーションの初期化
        var runner = Runner.create();

        // アニメーションを実行する
        Runner.run(runner, engine);
}

// ブロック崩し
function main3(){
        // Matter.jsのモジュールを取り込む
        const {Engine, Render, Runner, World, Bodies, Body, Events} = Matter;

        // エンジンとワールドのセットアップ
        const engine = Engine.create();
        const {world} = engine;


        //重力を0にする
        engine.world.gravity.y = 0;
        engine.world.gravity.x = 0;

        // 描画領域を設定
        const render = Render.create({
            element: document.body,
            engine: engine,
            options: {
                width: 800,
                height: 600,
                wireframes: false,
            }
        });
        Render.run(render);
        Runner.run(Runner.create(), engine);

        // 壁を追加
        const walls = [
            //上
            Bodies.rectangle(400, 0, 800, 50, {
                isStatic: true,
                render: {fillStyle: '#444'}
            }),
            //左
            Bodies.rectangle(0, 300, 50, 600, {
                isStatic: true,
                render: {fillStyle: '#444'}
            }),
            //右
            Bodies.rectangle(800, 300, 50, 600, {
                isStatic: true,
                render: {fillStyle: '#444'}
            }),
        ];
        World.add(world, walls);

        // バー
        const paddle = Bodies.rectangle(400, 550, 150, 20, {
            isStatic: true,
            render: {fillStyle: '#33f'}
        });
        World.add(world, paddle);

        // ボール
        const ball = Bodies.circle(300, 400, 10, {
            restitution: 1,//弾性
            frictionAir: 0, //空気抵抗を0に
            friction: 0, //摩擦を0に
            frictionStatic: 0,//摩擦を0に
            render: {fillStyle: '#f33'}
        });
        World.add(world, ball);

        //開始時に放出する
        Body.setVelocity(ball, {x: 10, y: 10});

        // ブロックを追加
        const blockRows = 5;
        const blockCols = 8;
        const blockWidth = 70;
        const blockHeight = 20;
        const blocks = [];

        for (let row = 0; row < blockRows; row++) {
            for (let col = 0; col < blockCols; col++) {
                const block = Bodies.rectangle(
                    120 + col * (blockWidth + 10),
                    80 + row * (blockHeight + 10),
                    blockWidth,
                    blockHeight,
                    {
                        isStatic: true,
                        restitution: 1,
                        friction: 0,
                        frictionStatic: 0,
                        render: {fillStyle: '#393'}
                    }
                );
                blocks.push(block);
                World.add(world, block);
            }
        }

        // キー操作でバーを動かす
        // キーの状態を追跡
        let isMovingLeft = false;
        let isMovingRight = false;
        const moveSpeed = 5; // バーの移動速度

        // キーを押した時のイベント
        document.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft') {
                isMovingLeft = true;
            } else if (event.key === 'ArrowRight') {
                isMovingRight = true;
            }
        });

        // キーを離した時のイベント
        document.addEventListener('keyup', event => {
            if (event.key === 'ArrowLeft') {
                isMovingLeft = false;
            } else if (event.key === 'ArrowRight') {
                isMovingRight = false;
            }
        });

        // バーを動かす
        Events.on(engine, 'beforeUpdate', () => {
            const {x, y} = paddle.position;

            if (isMovingLeft && x > 100) { // 左端に達していない場合のみ
                Body.translate(paddle, {x: -moveSpeed, y: 0});
            }
            if (isMovingRight && x < 700) { // 右端に達していない場合のみ
                Body.translate(paddle, {x: moveSpeed, y: 0});
            }
        });

        // ボールとブロックの衝突イベント
        Events.on(engine, 'collisionStart', event => {
            event.pairs.forEach(pair => {
                const {bodyA, bodyB} = pair;

                // ボールがブロックに当たった場合
                if (blocks.includes(bodyA) && bodyB === ball) {
                    World.remove(world, bodyA);
                } else if (blocks.includes(bodyB) && bodyA === ball) {
                    World.remove(world, bodyB);
                }


                //ブロックとボールが当たったときに加速させる
                if (bodyA === ball || bodyB === ball) {
                    const speed = 5; // 任意の速度
                    Body.setVelocity(ball, {
                        x: ball.velocity.x > 0 ? speed : -speed,
                        y: ball.velocity.y > 0 ? speed : -speed
                    });
                }
            });
        });
}

// たくさんのボール
function main4(){
    // Canvas
    const WIDTH  = 480;
    const HEIGHT = 320;

    // Modules
    const Engine     = Matter.Engine;
    const Render     = Matter.Render;
    const Runner     = Matter.Runner;
    const Body       = Matter.Body;
    const Bodies     = Matter.Bodies;
    const Bounds     = Matter.Bounds;
    const Common     = Matter.Common;
    const Composite  = Matter.Composite;
    const Composites = Matter.Composites;
    const Constraint = Matter.Constraint;
    const Events     = Matter.Events;
    const Mouse      = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

	// 2-1, Matter-Wrapを有効にする
	Matter.use("matter-wrap");// Matter-Wrap

	// Engine
	const engine = Engine.create();

	// Renderer
	const render = Render.create({
		element: document.body,
		engine: engine,
		options: {
			width: WIDTH, height: HEIGHT,
			showAngleIndicator: true,
			showCollisions: true,
			showDebug: false,
			showIds: true,
			showVelocity: true,
			hasBounds: true,
			wireframes: true// Important!!
		}
	});
	Render.run(render);

	// 1-1, Ballをまとめて配置する
	// cols × rowsだけBallができる
	const radius = 10;
	const cols = 5;
	const rows = 3;
	const stack = Composites.stack(WIDTH/2-radius*cols, 0, cols, rows, 0, 0, (x, y)=>{
		return Bodies.circle(x, y, radius, 
			{restitution: 0.5, friction: 0.00001, density: 0.001});
	});
	Composite.add(engine.world, stack);
	
	// 1-2, 地面
	const ground = Bodies.rectangle(WIDTH/2, HEIGHT*0.8, WIDTH*0.8, 20, 
		{isStatic: true, angle: Math.PI * 0.03});
	Composite.add(engine.world, [ground]);

	// 2-2, Matter-Wrap
	for(let i=0; i<stack.bodies.length; i++){
		stack.bodies[i].plugin.wrap = {
			min: { x: render.bounds.min.x, y: render.bounds.min.y },
			max: { x: render.bounds.max.x, y: render.bounds.max.y }
		};
	}

	// Mouse
	const mouse = Mouse.create(render.canvas);
	render.mouse = mouse;

	// MouseConstraint
	const mouseConstraint = MouseConstraint.create(engine, {
		mouse: mouse,
		constraint: {
			stiffness: 0.2,
			render: {visible: false}
		}
	});
	Composite.add(engine.world, mouseConstraint);

	// Runner
	const runner = Runner.create();
	Runner.run(runner, engine);
}
*/
const COLOR = {
    BACKGROUND: '#212529',
    OUTER: '#495057',
    INNER: '#15aabf',
    BALL: '#dee2e6',
    BALLA: '#ac7b93',
    BALLB: '#ccaaff',
    PADDLE: '#133591',
    BUMPER: '#fab005',
    BUMPER_LIT: '#fff3bf'
};

const GRAVITY = 0.1;
const WIREFRAMES = false;
const BUMPER_BOUNCE = 1.5;
const MAX_VELOCITY = 10;

const WIDTH = 500;
const HEIGHT = 800;

let myEngine;
let myWorld;
let myRender;
let myBall;
let collisionGroup;
let BallA;
let BallB;
let myPaddle;

let isMovingLeft = false;
let isMovingRight = false;
let moveSpeed = 5; // バーの移動速度

 let currentScore;
 let highScore;

function main5(){
    // 初期化
    init();

    // 壁・ペグ・バンパーなど
    createStaticBodies();

    // パドル
    createPaddle();

    // ボール
    createBall();

    // イベント
    createEvents();

    // ボール打ち上げ
    launchBall();
}

// 初期化
function init() {
    // engine (shared)
    myEngine = Matter.Engine.create();

    // world (shared)
    myWorld = myEngine.world;
    myWorld.gravity.y = GRAVITY; // simulate rolling on a slanted table

    // render (shared)
    myRender = Matter.Render.create({
      element: document.getElementById('container'),
      engine: myEngine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: WIREFRAMES,
        background: COLOR.BACKGROUND,
        showAngleIndicator: true,
        showCollisions: true,
        showDebug: false,
        showIds: true,
        showVelocity: true,
        hasBounds: true,
      }
    });
    Matter.Render.run(myRender);

    // runner
    let runner = Matter.Runner.create();
    Matter.Runner.run(runner, myEngine);

    // used for collision filtering on various bodies
    // さまざまなボディの衝突フィルタリングに使用される
    // false：このグループ同士は衝突判定をする
    collisionGroup = Matter.Body.nextGroup(false);

    // 得点初期化
    currentScore = 0;
    highScore = 0;
}

// 枠や壁作成
// 静的図形の作成
function createStaticBodies() {
    // 静的図形は、Worldに一気に追加する
    // それぞれの関数の戻り値を登録している
    Matter.World.add(myWorld, [
        // 外枠(top, bottom, left, right)
        // x, y, width, height
        boundary(250, -30, 500, 100),
        boundary(250, 830, 500, 100, 'bottom'),
        boundary(-30, 400, 100, 800),
        boundary(530, 400, 100, 800),

        // 斜め
        polygon(470, 60, '0 0 100 200 100 0 0 0'),
        polygon(80, 400, '0 0 0 200 50 100 0 0'),
        polygon(420, 300, '0 0 0 200 -50 100 0 0'),

        // ペグ(left, mid, right)
        // x, y, width, height, color, angle = 0
        wall(120, 140, 20, 40, COLOR.INNER),
        wall(225, 140, 20, 40, COLOR.INNER, 20),
        wall(330, 140, 20, 40, COLOR.INNER),
        wall(150, 540, 20, 40, COLOR.INNER),
        wall(275, 540, 20, 40, COLOR.INNER, -20),
        wall(400, 540, 20, 40, COLOR.INNER),

        // バンパー
        // bottom bumpers (left, right)
        bumper(165, 340),
        bumper(285, 340),
        bumper(230, 440),
        bumper(370, 440)
    ]);
}

// パドル作成
function createPaddle(){
    // バー
    myPaddle = Matter.Bodies.rectangle(250, 700, 60, 15, {
        label: 'paddle',
        isStatic: true,
        render: {
            fillStyle: COLOR.PADDLE
        }
    });
    Matter.World.add(myWorld, myPaddle);
}

// ボール作成
function createBall() {
    // x/y are set to when pinball is launched
    myBall = Matter.Bodies.circle(0, 0, 14, {
        label: 'myBall',
        restitution: 1,     //弾性（0～1,1=>100%で跳ね返る）
        frictionAir: 0,     //空気抵抗（0～,0=>摩擦無し）
        friction: 0,        //動摩擦（0～1,0=>摩擦無し,1=>瞬時に止まる）
        frictionStatic: 0,  //静摩擦（0=>静止しているときに「固着」することがなく、動摩擦のみがfriction使用される,値が大きいほど、ほぼ静止しているときに物体を最初に動かすために必要な力が大きくなる）
        density: 0.001,     //密度（小さいほど重い）
        collisionFilter: {
            group: collisionGroup
        },
        render: {
            fillStyle: COLOR.BALL
        }
    });
    Matter.World.add(myWorld, myBall);

    BallA = Matter.Bodies.circle(0, 0, 20, {
        label: 'BallA',
        restitution: 0.9,       //弾性（0～1,1=>100%で跳ね返る）
        frictionAir: 0.005,     //空気抵抗（0～,0=>摩擦無し）
        friction: 0,            //動摩擦（0～1,0=>摩擦無し,1=>瞬時に止まる）
        frictionStatic: 0,      //静摩擦（0=>静止しているときに「固着」することがなく、動摩擦のみがfriction使用される,値が大きいほど、ほぼ静止しているときに物体を最初に動かすために必要な力が大きくなる）
        collisionFilter: {
            group: collisionGroup
        },
        render: {
            fillStyle: COLOR.BALLA
        }
    });
    Matter.World.add(myWorld, BallA);
/*
    BallB = Matter.Bodies.circle(0, 0, 30, {
        label: 'BallB',
        restitution: 1,     //弾性
        frictionAir: 0,     //空気抵抗を0に
        friction: 0.0001,        //摩擦を0に
        frictionStatic: 0.0001,  //摩擦を0に
        collisionFilter: {
            group: collisionGroup
        },
        render: {
            fillStyle: COLOR.BALLB
        }
    });
    Matter.World.add(myWorld, BallB);
*/
}

// ボール出し
function launchBall() {
    updateScore(0);

    Matter.Body.setPosition(myBall, { x: 465, y: 750 });
    Matter.Body.setVelocity(myBall, { x: 0, y: -25 + rand(-2, 2) });
    //Matter.Body.setPosition(myBall, { x: 150 + rand(-30, 30), y: 400 });
    //Matter.Body.setVelocity(myBall, { x: rand(-10, 10), y: -25 + rand(-2, 2) });
    Matter.Body.setAngularVelocity(myBall, 0);

    //Matter.Body.setPosition(BallA, { x: 100 + rand(-30, 30), y: 80 });
    //Matter.Body.setPosition(BallA, { x: 250 + rand(-30, 30), y: 400 });
    //Matter.Body.setVelocity(BallA, { x: rand(-10, 10), y: -25 + rand(-2, 2) });
    //Matter.Body.setAngularVelocity(BallA, 0);
/*
    Matter.Body.setPosition(BallB, { x: 350 + rand(-30, 30), y: 400 });
    Matter.Body.setVelocity(BallB, { x: rand(-10, 10), y: -25 + rand(-2, 2) });
    Matter.Body.setAngularVelocity(BallB, 0);
*/
}

// 乱数（min～maxの小数）
function rand(min, max) {
    return Math.random() * (max - min + 1) + min;
}

// 外枠
// x,yは長方形の中心
function boundary(x, y, width, height, name = '') {
    //return Matter.Bodies.rectangle(x, y, width, height, {
    let boundary = Matter.Bodies.rectangle(x, y, width, height, {
        label: name,
        isStatic: true,
        render: {
            fillStyle: COLOR.OUTER
        }
    });
    return boundary;
}

// ペグ
function wall(x, y, width, height, color, angle = 0) {
    //return Matter.Bodies.rectangle(x, y, width, height, {
    let wall =  Matter.Bodies.rectangle(x, y, width, height, {
        angle: angle,
        isStatic: true,
        chamfer: { radius: 10 },
        render: {
            fillStyle: color
        }
    });
    return wall;
}

// 多角形
// Matter.Vertices.fromPathは凸図形のみ
// ただし、decompを読み込ませると凹図形も可能になる
function polygon(x, y, path) {
    //alert("x = " + x + " y = " + y +" path = " + path);
    let vertices = Matter.Vertices.fromPath(path);
    //return Matter.Bodies.fromVertices(x, y, vertices, {
    let polygon = Matter.Bodies.fromVertices(x, y, vertices, {
        isStatic: true,
        render: {
            fillStyle: COLOR.OUTER,
            strokeStyle: COLOR.OUTER,
            lineWidth: 1
        }
    });
    return polygon;
}

// バンパー
function bumper(x, y) {
    let bumper = Matter.Bodies.circle(x, y, 25, {
        label: 'bumper',
        isStatic: true,
        //restitution: BUMPER_BOUNCE,     // ここでの設定では効果無し
        render: {
            fillStyle: COLOR.BUMPER
        }
    });

    // バンパーの弾性
    bumper.restitution = BUMPER_BOUNCE;
    return bumper;
}

// イベント
function createEvents() {
    // キー操作でパドルを動かす
    // キーの状態を追跡
    // キーを押した時のイベント
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft') {
            isMovingLeft = true;
        } else if (event.key === 'ArrowRight') {
            isMovingRight = true;
        }
    });

    // キーを離した時のイベント
    document.addEventListener('keyup', function(event) {
        if (event.key === 'ArrowLeft') {
            isMovingLeft = false;
        } else if (event.key === 'ArrowRight') {
            isMovingRight = false;
        }
    });

    // パドルを動かす
    Matter.Events.on(myEngine, 'beforeUpdate', function(event) {
        let {x, y} = myPaddle.position;

        if (isMovingLeft && x > 50) { // 左端に達していない場合のみ
            Matter.Body.translate(myPaddle, {x: -moveSpeed, y: 0});
        }
        if (isMovingRight && x < 450) { // 右端に達していない場合のみ
            Matter.Body.translate(myPaddle, {x: moveSpeed, y: 0});
        }
    });

    // ピンボールの速度を調整する
    Matter.Events.on(myEngine, 'beforeUpdate', function(event) {
        Matter.Body.setVelocity(myBall, {
            x: Math.max(Math.min(myBall.velocity.x, MAX_VELOCITY), -MAX_VELOCITY),
            y: Math.max(Math.min(myBall.velocity.y, MAX_VELOCITY), -MAX_VELOCITY)
        });
    });

    // 当たり判定
    Matter.Events.on(myEngine, 'collisionStart', function(event) {
        let pairs = event.pairs;
        //alert('pairs.length=' + pairs.length);
        pairs.forEach(function(pair) {
            //alert('pair.bodyA.label=' + pair.bodyA.label);
            //alert('pair.bodyB.label=' + pair.bodyB.label);
            // 先にcreateしたものが、bodyAとなる
            if (pair.bodyA.label === 'myBall') {
                switch (pair.bodyB.label) {
                    case 'BallA':
                    //alert('myBallとBallA当たり');
                    break;
                    case 'BallB':
                    //alert('myBallとBallB当たり');
                    break;
                }
            }
            if (pair.bodyA.label === 'BallA') {
                switch (pair.bodyB.label) {
                    case 'BallB':
                        //alert('BallAとBallB当たり');
                        break;
                }
            }
            if (pair.bodyA.label === 'paddle') {
                switch (pair.bodyB.label) {
                    case 'myBall':
                        //alert('paddleとmyBall当たり');
                        Matter.Body.setVelocity(myBall, {
                            x: MAX_VELOCITY * rand(0, 1),
                            y: MAX_VELOCITY * rand(0, 1)
                        });
                        break;
                    case 'BallA':
                        //alert('paddleとBallA当たり');
                        Matter.Body.setVelocity(BallA, {
                            x: MAX_VELOCITY * rand(0, 1),
                            y: MAX_VELOCITY * rand(0, 1)
                        });
                        break;
                    case 'BallB':
                        //alert('paddleとBallB当たり');
                        break;
                }
            }
            if (pair.bodyA.label === 'bumper') {
                pingBumper(pair.bodyA);
            }
            if (pair.bodyA.label === 'bottom') {
                switch (pair.bodyB.label) {
                    case 'myBall':
                        //alert('bottomとmyBall当たり');
                        Matter.Body.setVelocity(pair.bodyB, { x: 0, y: 0 });
                        Matter.Body.setAngularVelocity(pair.bodyB, 0);
                        break;
                    case 'BallA':
                        //alert('bottomとBallA当たり');
                        Matter.Body.setVelocity(pair.bodyB, { x: 0, y: 0 });
                        Matter.Body.setAngularVelocity(pair.bodyB, 0);
                        break;
                    case 'BallB':
                        //alert('bottomとBallB当たり');
                        break;
                }
            }
        });
    });
}

// バンパー点滅
function pingBumper(bumper) {
    updateScore(currentScore + 10);

    // バンパー点滅
    bumper.render.fillStyle = COLOR.BUMPER_LIT;
    setTimeout(function() {
        bumper.render.fillStyle = COLOR.BUMPER;
    }, 100);
}

// 得点
function updateScore(newCurrentScore) {
    let currentScoreElm = document.getElementById('current-score');
    let highScoreElm = document.getElementById('high-score');
    currentScore = newCurrentScore;
    currentScoreElm.innerHTML = currentScore;

    highScore = Math.max(currentScore, highScore);
    highScoreElm.innerHTML = highScore;
}