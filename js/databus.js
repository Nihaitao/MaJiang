import Pool from './base/pool'

let instance

/**
 * 全局状态管理器
 */
export default class DataBus {
  constructor() {
    if (instance)
      return instance

    instance = this

    this.pool = new Pool()

    this.reset()
  }

  reset() {
    this.mjArr = []
    this.currentId = 0
    this.passId = 0
    this.hidden = false
  }

  /**
   * 获取麻将能运动的轨迹
   */
  getPathOfParticle(majiang) {
    majiang.movePath = []
    const hiddenArr = this.mjArr.filter(item => {
      return !item.visible
    })
    if (hiddenArr.length > 0) {
      hiddenArr.forEach(item => {
        if (item.row === majiang.row && item.col > majiang.col) {
          majiang.movePath.push({
            'left': item.col
          })
        } else if (item.row === majiang.row && item.col < majiang.col) {
          majiang.movePath.push({
            'right': item.col
          })
        } else if (item.row > majiang.row && item.col === majiang.col) {
          majiang.movePath.push({
            'up': item.col
          })
        } else if (item.row < majiang.row && item.col === majiang.col) {
          majiang.movePath.push({
            'down': item.col
          })
        }
      })


      console.log(majiang)
    }
  }
  /**
   * 回收敌人，进入对象池
   * 此后不进入帧循环
   */
  removeEnemey(enemy) {
    let temp = this.enemys.shift()

    temp.visible = false

    this.pool.recover('enemy', enemy)
  }

  /**
   * 回收子弹，进入对象池
   * 此后不进入帧循环
   */
  removeBullets(bullet) {
    let temp = this.bullets.shift()

    temp.visible = false

    this.pool.recover('bullet', bullet)
  }
}