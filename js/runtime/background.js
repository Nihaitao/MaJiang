const BG_IMG_SRC = 'images/bg.jpg'
/**
 * 游戏背景类
 */
export default class BackGround {
  constructor(ctx) {
    this.img = new Image()
    this.img.src = BG_IMG_SRC

    this.render(ctx)
  }

  render(ctx) {
    ctx.drawImage(
      this.img,
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )
  }
}
