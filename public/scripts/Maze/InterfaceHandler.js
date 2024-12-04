class InterfaceHandler {
  constructor() {
      this.Tutorial = [];
      this.GameTexts = [];
      this.ServerMessages = [];
  }

  AddGameText(content, x, y, duration = false) {
      const timestamp = millis();
      this.GameTexts.push({ content, x, y, duration, timestamp });

      return this.GameTexts.length - 1;
  }

  RemoveGameText(index) {
      if (index >= 0 && index < this.GameTexts.length) {
          this.GameTexts.splice(index, 1);
      }
  }

  DrawUI() {
      push();
      resetMatrix();

      if (isHoldingSpace && minigame.active) {
        minigame.update();
        minigame.draw(width / 2 - 150, height - 50, 300, 15);
      }
    
      if (player.Type == "Player") {
          const barWidth = 300; 
          const barHeight = 10;
          const x = windowWidth - windowWidth * 0.25;
          const yHealth = windowHeight * 0.06;
          const yStamina = windowHeight * 0.08;

          fill(0);
          rect(x - 2, yHealth - 2, barWidth + 4, barHeight + 4);
          rect(x - 2, yStamina - 2, barWidth + 4, barHeight + 4);

          fill(200, 0, 0);
          rect(x, yHealth, map(player.Health, 0, player.MaxHealth, 0, barWidth), barHeight);

          fill(0, 0, 255);
          rect(x, yStamina, map(player.Stamina, 0, player.MaxStamina, 0, barWidth), barHeight);
      }

      for (let i = this.GameTexts.length - 1; i >= 0; i--) {
        const textObj = this.GameTexts[i];
        const elapsed = millis() - textObj.timestamp;
    
        if (textObj.duration && elapsed > textObj.duration) {
            this.RemoveGameText(i);
        } else {
            let opacity = 255;
            if (textObj.duration) {
                opacity = map(elapsed, 0, textObj.duration, 255, 0);
            }
            fill(255, 255, 255, opacity);
    
            textAlign(CENTER, CENTER);
            textSize(20);
            
            text(textObj.content, windowWidth * textObj.x, windowHeight * textObj.y);
        }
    }
      

      pop();
      
  }
}
