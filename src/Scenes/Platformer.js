class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
        
        this.gemCount = 0;
        this.playMode = false;
        this.keyGet = false;
    }

    init() {
        // variables and settings
        this.ACCELERATION = 200;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 900;
        this.JUMP_VELOCITY = -450;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 160, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("pixel_tilemap_packed", "tilemap_tiles");
        this.BGtileset = this.map.addTilesetImage("pixel_backgrounds_tilemap_packed", "BGtilemap_tiles");

        // Create a layer
        // this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.backgroundLayer = this.map.createLayer("Background", this.BGtileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        this.platformLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.terrainLayer = this.map.createLayer("Terrain", this.tileset, 0, 0);
        // Make it collidable
        this.groundLayer.forEachTile(tile => {
            if (tile.index !== -1) { // Exclude empty tiles
                // Only enable collision on the top side of the tile
                tile.setCollision(true, true, true, true);
            }
        });

        this.platformLayer.forEachTile(tile => {
            if (tile.index !== -1) { // Exclude empty tiles
                // Only enable collision on the top side of the tile
                tile.setCollision(false, false, true, false);
            }
        });

        // TODO: Add createFromObjects here
        // Find gems in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "gem"
        // Assign the gem texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(150, 375, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        this.gems = this.map.createFromObjects("Gems", {
            name: "gem",
            key: "tilemap_sheet",
            frame: 67
        });

        // Create a Phaser group out of the array this.gems
        // This will be used for collision detection below.
        this.gemGroup = this.add.group(this.gems);

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.gems, Phaser.Physics.Arcade.STATIC_BODY);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.platformLayer);

        // TODO: Add gem collision handler
        // Handle collision detection with gems
        this.physics.add.overlap(my.sprite.player, this.gemGroup, (obj1, obj2) => {
            this.sound.play("gem");
            obj2.destroy();
            this.gemCount++;
            my.text.score.setText(this.gemCount);
            console.log(this.gemCount);
        });

        this.doorKeyhole = this.map.createFromObjects("DoorKeyHole", {
            name: "keyhole",
            key: "tilemap_sheet",
            frame: 28
        });

        this.door = this.map.createFromObjects("DoorKeyHole", {
            name: "door",
            key: "tilemap_sheet",
            frame: 9
        });

        this.key = this.map.createFromObjects("Key", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27
        });

        this.exit = this.map.createFromObjects("Exit", {
            name: "exit",
            key: "tilemap_sheet",
            frame: 87
        });

        this.doorGroup = this.add.group(this.door);

        this.physics.world.enable(this.door, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.doorKeyhole, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.key, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.exit, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.add.collider(my.sprite.player, this.door);

        this.physics.add.overlap(my.sprite.player, this.key, (obj1, obj2) => {
            this.sound.play("key");
            obj2.destroy();
            this.keyGet = true;
        });

        this.physics.add.overlap(my.sprite.player, this.doorKeyhole, (obj1, obj2) => {
            if(this.keyGet) {
                this.sound.play("door");
                obj2.destroy();
                this.doorGroup.children.each(door => {
                    door.destroy();
                });
            }
        });

        this.physics.add.overlap(my.sprite.player, this.exit, (obj1, obj2) => {
            this.sound.play("win");
            obj2.destroy();
            this.playMode = false;
            my.sprite.EndScreen.visible = true;
            my.text.score.visible = true;
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.SpaceKey = this.input.keyboard.addKey('SPACE');

        // debug key listener (assigned to D key)
        // this.input.keyboard.on('keydown-D', () => {
        //     this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
        //     this.physics.world.debugGraphic.clear()
        // }, this);
        this.physics.world.drawDebug = false;

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 5, "kenny-particles", {
            frame: ['star_01.png'],
            // TODO: Try: add random: true
            scale: {start: 0.01, end: 0.04},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 80,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: 10,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.jumping = this.add.particles(0, 5, "kenny-particles", {
            frame: ['star_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.1, end: 0.2},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 80,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: 10,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        my.vfx.jumping.stop();
        

        // TODO: add camera code here
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        my.sprite.TitleScreen = this.add.sprite(360, 225, "Title");
        my.sprite.TitleScreen.scale = 0.5;

        my.sprite.EndScreen = this.add.sprite(360, 225, "End");
        my.sprite.EndScreen.scale = 0.5;
        my.sprite.EndScreen.visible = false;

        my.text.score = this.add.text(280, 120, this.gemCount, { fontSize: 36 , color: "black", fontweight: "bold"})
        my.text.score.setStroke('black', 3);
        my.text.score.visible = false;
        


    }

    update() {
        if(cursors.left.isDown && this.playMode) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here

            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown && this.playMode) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here

            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();

            }


        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing

            my.vfx.walking.stop();
            
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && this.playMode) {
            this.sound.play("jump");
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jumping.start();
        } else {
            my.vfx.jumping.stop();
        }

        if(Phaser.Input.Keyboard.JustDown(this.SpaceKey)) {
            if(my.sprite.TitleScreen.visible) {
                my.sprite.TitleScreen.visible = false;
                this.playMode = true;
            }
            if(this.keyGet && my.sprite.EndScreen.visible) {
                this.scene.restart();
                my.sprite.TitleScreen.visible = false;
                this.gemCount = 0;
                this.keyGet = false;
                //this.playMode = true;
            }
            
        }
    }

}