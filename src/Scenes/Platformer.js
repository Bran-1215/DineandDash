class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");

        this.foodScore = 0;
        this.playMode = false;
        this.timeLimit = 200;
        this.waveCount = 0;
    }

    init() {
        // variables and settings
        this.ACCELERATION = 200;
        this.DRAG = 900;
        this.physics.world.gravity.y = 900;
        this.JUMP_VELOCITY = -450;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 1.0;
    }

    create() {
        // Creating Tilemap and layers
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 160, 25);
        this.tileset = this.map.addTilesetImage("pixel_tilemap_packed", "tilemap_tiles");
        this.BGtileset = this.map.addTilesetImage("pixel_backgrounds_tilemap_packed", "BGtilemap_tiles");

        this.backgroundLayer = this.map.createLayer("Background", this.BGtileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        this.platformLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.terrainLayer = this.map.createLayer("Terrain", this.tileset, 0, 0);

        // Collisions for ground tiles and platform tiles
        this.groundLayer.forEachTile(tile => {
            if (tile.index !== -1) {
                tile.setCollision(true, true, true, true);
            }
        });
        this.platformLayer.forEachTile(tile => {
            if (tile.index !== -1) {
                tile.setCollision(false, false, true, false);
            }
        });


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(150, 375, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Setup Food
        this.foodDistance1 = this.map.createFromObjects("Pizza1", {
            name: "pizza1",
            key: "tilemap-food_sheet",
            frame: 106
        });

        this.foodDistance2 = this.map.createFromObjects("Pizza2", {
            name: "pizza2",
            key: "tilemap-food_sheet",
            frame: 106
        });

        this.foodDistance3 = this.map.createFromObjects("Pizza3", {
            name: "pizza3",
            key: "tilemap-food_sheet",
            frame: 106
        });

        this.foodBurger = this.map.createFromObjects("Burger", {
            name: "burger",
            key: "tilemap-food_sheet",
            frame: 92
        });

        // Add the food objects to the group
        this.foodGroup = this.add.group();

        this.foodDistance1.forEach(food => {
            this.foodGroup.add(food);
        });

        this.foodDistance2.forEach(food => {
            this.foodGroup.add(food);
        });

        this.foodDistance3.forEach(food => {
            this.foodGroup.add(food);
        });

        this.foodBurger.forEach(food => {
            this.foodGroup.add(food);
        });

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.platformLayer);

        this.physics.world.enable(this.foodDistance1, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.foodDistance2, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.foodDistance3, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.foodBurger, Phaser.Physics.Arcade.STATIC_BODY);

        this.physics.add.overlap(my.sprite.player, this.foodGroup, (obj1, obj2) => {
            if (obj2.visible) {
                obj2.visible = false;
                if (obj2.name == "burger") {
                    this.sound.play("key");
                    this.foodScore += 50;
                    this.timeLimit += 100;
                }
                else {
                    this.sound.play("gem");
                this.foodScore += 10;
                this.timeLimit += 20;
                }
                my.text.score.setText(this.foodScore);
                my.text.scoreHUD.setText("Score:" + this.foodScore);
            }
        });

        this.spawnFood();


        // Inputs
        cursors = this.input.keyboard.createCursorKeys();
        this.SpaceKey = this.input.keyboard.addKey('SPACE');


        // Movement VFX
        my.vfx.walking = this.add.particles(0, 5, "kenny-particles", {
            frame: ['star_01.png'],
            scale: { start: 0.01, end: 0.04 },
            maxAliveParticles: 80,
            lifespan: 350,
            gravityY: 10,
            alpha: { start: 1, end: 0.1 },
        });
        my.vfx.jumping = this.add.particles(0, 5, "kenny-particles", {
            frame: ['star_09.png'],
            scale: { start: 0.1, end: 0.2 },
            maxAliveParticles: 80,
            lifespan: 350,
            gravityY: 10,
            alpha: { start: 1, end: 0.1 },
        });
        my.vfx.walking.stop();
        my.vfx.jumping.stop();


        // Camera
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        this.physics.world.drawDebug = false;

        // HUD Elements
        this.timeBar = this.add.graphics();
        this.drawBar();

        my.sprite.TitleScreen = this.add.sprite(360, 225, "Title");
        my.sprite.TitleScreen.scale = 0.5;

        my.sprite.EndScreen = this.add.sprite(360, 225, "End");
        my.sprite.EndScreen.scale = 0.5;
        my.sprite.EndScreen.visible = false;

        my.text.score = this.add.text(280, 120, this.foodScore, { fontSize: 36, color: "black", fontweight: "bold" })
        my.text.score.setStroke('black', 3);
        my.text.score.visible = false;

        my.text.wave = this.add.text(0, 0, "Wave:" + this.waveCount, { fontSize: 24, color: "black", fontweight: "bold" })
        my.text.wave.visible = false;

        my.text.scoreHUD = this.add.text(0, 0, "Score:" + this.foodScore, { fontSize: 24, color: "black", fontweight: "bold" })
        my.text.scoreHUD.visible = false;



    }

    update() {
        if (this.playMode) {
            this.timeLimit -= 0.075;
            this.timeBar.setPosition(this.cameras.main.scrollX + 300, this.cameras.main.scrollY + 10);
            my.text.wave.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY + 10);
            my.text.wave.visible = true;
            my.text.scoreHUD.setPosition(this.cameras.main.scrollX + 125, this.cameras.main.scrollY + 10);
            my.text.scoreHUD.visible = true;
            this.drawBar();
            if (this.allFoodEaten()) {
                this.waveCount++;
                my.text.wave.setText("Wave:" + this.waveCount);
                this.spawnFood();

            }

        }

        // Game ends when time limit reaches 0
        if (this.timeLimit < 0) {
            let gameOverNoise = true;
            if (gameOverNoise) {
                this.sound.play("door");
                gameOverNoise = false;
            }
            this.timeLimit = 1;
            my.sprite.player.setPosition(150, 375);
            this.playMode = false;
            my.text.wave.visible = false;
            my.text.scoreHUD.visible = false;
            my.sprite.EndScreen.visible = true;
            my.text.score.visible = true;
        }



        // Player Movement
        if (cursors.left.isDown && this.playMode) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();

            }
        } else if (cursors.right.isDown && this.playMode) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();

            }
        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();

        }

        // Player Jump
        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && this.playMode) {
            this.sound.play("jump");
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.jumping.start();
        } else {
            my.vfx.jumping.stop();
        }

        // Starting and Restarting the game using SPACE
        if (Phaser.Input.Keyboard.JustDown(this.SpaceKey)) {
            if (my.sprite.TitleScreen.visible) {
                my.sprite.TitleScreen.visible = false;
                this.playMode = true;
                my.sprite.player.setPosition(1619, 375);
            }
            if (my.sprite.EndScreen.visible) {
                this.scene.restart();
                my.sprite.TitleScreen.visible = false;
                this.foodScore = 0;
                this.waveCount = 0;
                this.timeLimit = 200;
            }

        }
    }

    drawBar() {
        // Clear the previous bar
        this.timeBar.clear();

        // Set the fill style to green (0x00ff00 is the hex color for green)
        this.timeBar.fillStyle(0x00ff00);

        // Draw the bar (x, y, width, height)
        this.timeBar.fillRect(0, 0, this.timeLimit, 20);
    }

    spawnFood() {
        let wave = this.waveCount;
        // Completing waves gives more time the further the player is
        this.timeLimit += 25;
        if (wave >= 5) {
            this.timeLimit += 25;
        }
        if (wave >= 10) {
            this.timeLimit += 25;
        }
        console.log("wave: " + wave);

        // Hides each food item initially
        this.foodGroup.children.each(function (child) {
            if (child.visible) {
                child.setVisible(false);
            }
        });

        // Randomly spawns food items, spawning further foods as the waves progress
        this.foodGroup.children.each(function (child) {
            if (child.name === "pizza1") {
                if (!child.visible) {
                    if (Math.random() < 0.7) {
                        child.setVisible(true);
                    }
                }
            }
            if (child.name === "pizza2" && wave >= 2) {
                if (!child.visible) {
                    if (Math.random() < 0.5) {
                        child.setVisible(true);
                    }
                }
            }
            if (child.name === "pizza3" && wave >= 4) {
                if (!child.visible) {
                    if (Math.random() < 0.3) {
                        child.setVisible(true);
                    }
                }
            }
            if (child.name === "burger" && wave >= 6) {
                if (!child.visible) {
                    if (Math.random() < 0.4) {
                        child.setVisible(true);
                    }
                }
            }
        });
    }

    allFoodEaten() {
        let allNotVisible = true;
        this.foodGroup.children.each(function (child) {
            if (child.visible) {
                // If any food is found to be visible, exit the loop
                allNotVisible = false;
                return false;
            }
        });
        return allNotVisible;
    }
}