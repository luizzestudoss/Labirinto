let spriteSheet
let frameIndex = 0;
let frameCount = 6;
let isAnimationPlaying = true;
let frameWidth = 32;
let frameHeight = 32;
let animationFrameRate = 5;
let lastFrameTime = 0;

function SpiderWebAnimation(player) {
    spriteSheet = Sprites['SpiderWebEffect']

    let currentTime = millis();
    
    if (isAnimationPlaying) {
      if (currentTime - lastFrameTime > 1000 / animationFrameRate) {
        frameIndex++;
        lastFrameTime = currentTime;
      }
      
      if (frameIndex >= frameCount) {
        frameIndex = frameCount - 1;
        isAnimationPlaying = false;
      }
    }
    
    let sx = frameIndex * frameWidth;
    let sy = 7 * frameHeight;
    
    image(
      spriteSheet,
      player.pos.x - frameWidth / 2 + 0,
      player.pos.y - frameHeight / 2 - 3.5,
      frameWidth,
      frameHeight,
      sx,
      sy,
      frameWidth,
      frameHeight
    );
  }