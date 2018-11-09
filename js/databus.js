import Pool from './base/pool'
import Music from './runtime/music'
import Score from './runtime/score'

let instance
let music = new Music()

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
    this.dyadicArr = new Array()
    for (var i = 0; i < 6; i++) { //一维长度为5
      this.dyadicArr[i] = new Array(i); //在声明二维
      for (var j = 0; j < 18; j++) { //二维长度为18
        this.dyadicArr[i][j] = 0;
      }
    }
    this.change = []
    this.touchmove = null //判断是否移动麻将
    this.currentMj = null
    this.scorelist = [] //得分列表
    this.totalScore = 0
    this.startTime = Date.now()
    this.gameWin = false
  }

  /**
   * 获取麻将能运动的轨迹
   */
  getPathOfParticle(majiang) {
    majiang.movePath = []
    //1确定能够往左如何移动
    let left = 0
    let leftArr = []
    let leftEat = false
    for (let i = majiang.col - 1; i >= 0; i--) {
      if (this.dyadicArr[majiang.row][i] === 0) { //往左可以移动
        left++
      } else if (this.dyadicArr[majiang.row][i] === majiang.Identification) { //往左可以吃
        if (leftArr.length === 0) {
          leftEat = true
          break
        } else if (left > 0) {
          break
        } else {
          leftArr.push(this.dyadicArr[majiang.row][i])
        }
      } else { //碰到其他麻将了
        if (left > 0) {
          break
        } else {
          leftArr.push(this.dyadicArr[majiang.row][i])
        }
      }
    }
    majiang.movePath.push({ "left": `${left}_${leftArr.length}_${leftEat}` })

    //2确定能够往右如何移动
    let right = 0
    let rightArr = []
    let rightEat = false
    for (let i = majiang.col + 1; i <= 17; i++) {
      if (this.dyadicArr[majiang.row][i] === 0) { //往右可以移动
        right++
      } else if (this.dyadicArr[majiang.row][i] === majiang.Identification) { //往右可以吃
        if (rightArr.length === 0) {
          rightEat = true
          break
        } else if (right > 0) {
          break
        } else {
          rightArr.push(this.dyadicArr[majiang.row][i])
        }
      } else { //碰到其他麻将了
        if (right > 0) {
          break
        } else {
          rightArr.push(this.dyadicArr[majiang.row][i])
        }
      }
    }
    majiang.movePath.push({ "right": `${right}_${rightArr.length}_${rightEat}` })

    //3确定能够往上如何移动
    let up = 0
    let upArr = []
    let upEat = false
    for (let i = majiang.row - 1; i >= 0; i--) {
      if (this.dyadicArr[i][majiang.col] === 0) { //往上可以移动
        up++
      } else if (this.dyadicArr[i][majiang.col] === majiang.Identification) { //往上可以吃
        if (upArr.length === 0) {
          upEat = true
          break
        } else if (up > 0) {
          break
        } else {
          upArr.push(this.dyadicArr[i][majiang.col])
        }
      } else { //碰到其他麻将了
        if (up > 0) {
          break
        } else {
          upArr.push(this.dyadicArr[i][majiang.col])
        }
      }
    }
    majiang.movePath.push({ "up": `${up}_${upArr.length}_${upEat}` })

    //4确定能够往下如何移动
    let down = 0
    let downArr = []
    let downEat = false
    for (let i = majiang.row + 1; i <= 5; i++) {
      if (this.dyadicArr[i][majiang.col] === 0) { //往下可以移动
        down++
      } else if (this.dyadicArr[i][majiang.col] === majiang.Identification) { //往下可以吃
        if (downArr.length === 0) {
          downEat = true
          break
        } else if (down > 0) {
          break
        } else {
          downArr.push(this.dyadicArr[i][majiang.col])
        }
      } else { //碰到其他麻将了
        if (down > 0) {
          break
        } else {
          downArr.push(this.dyadicArr[i][majiang.col])
        }
      }
    }
    majiang.movePath.push({ "down": `${down}_${downArr.length}_${downEat}` })
  }

  //更新麻将位置
  resetMjArr() {
    this.change.forEach(item => {
      this.mjArr.forEach(mj => {
        if (mj.row === item.row && mj.col === item.col && mj.visible) {
          if (item.move === 'left') {
            mj.x = Math.min(item.x, mj.ex_x)
            if (item.disabled) {
              this.touchmove = null
              music.eatMaJiang()
              this.score(mj.Identification)
              console.log(1)
              mj.visible = false
              this.mjArr.forEach(x => {
                if (x.row === item.row && x.col === mj.col - item.step && x.visible) {
                  x.visible = false
                }
              })
            }
          } else if (item.move === 'right') {
            mj.x = Math.max(item.x, mj.ex_x)
            if (item.disabled) {
              this.touchmove = null
              music.eatMaJiang()
              this.score(mj.Identification)
              mj.visible = false
              this.mjArr.forEach(x => {
                if (x.row === item.row && x.col === mj.col + item.step && x.visible) {
                  x.visible = false
                }
              })
            }
          } else if (item.move === 'up') {
            mj.y = Math.min(item.y, mj.ex_y)
            if (item.disabled) {
              this.touchmove = null
              music.eatMaJiang()
              this.score(mj.Identification)
              mj.visible = false
              this.mjArr.forEach(x => {
                if (x.row === item.row - item.step && x.col === mj.col && x.visible) {
                  x.visible = false
                }
              })
            }
          } else if (item.move === 'down') {
            mj.y = Math.max(item.y, mj.ex_y)
            if (item.disabled) {
              this.touchmove = null
              music.eatMaJiang()
              this.score(mj.Identification)
              mj.visible = false
              this.mjArr.forEach(x => {
                if (x.row === item.row + item.step && x.col === mj.col && x.visible) {
                  x.visible = false
                }
              })
            }
          } else if (item.disabled) {
            this.touchmove = null
            music.eatMaJiang()
            this.score(mj.Identification)
            mj.visible = false
          }
        }
      })
    })
    this.change = []
  }

  //判断周围可以吃的麻将
  around(mj) {
    if (this.touchmove) {
      //横向移动，纵向检查
      if (mj.currentMoving === 'left' || mj.currentMoving === 'right') {
        const moveX = Math.abs(mj.x - mj.ex_x) / (mj.width * 0.64)
        const moveStep = Math.round(moveX)
        if (Math.abs(moveX - moveStep) < 0.3 && moveStep > 0) {
          let upRow = -1, downRow = -1
          const col = mj.currentMoving === 'left' ? mj.col - moveStep : mj.col + moveStep
          const moveCounts = mj.currentMoving === 'left' ? mj.movePath[0].left.split('_')[1] : mj.movePath[1].right.split('_')[1]
          //往上
          if (mj.row > 0) {
            for (let i = mj.row - 1; i >= 0; i--) {
              if (this.dyadicArr[i][col] > 0 && this.dyadicArr[i][col] !== mj.Identification) {
                break
              } else if (this.dyadicArr[i][col] === mj.Identification && mj.visible) {
                upRow = i
                break
              }
            }
          }
          //往下
          if (mj.row < 5) {
            for (let i = mj.row + 1; i <= 5; i++) {
              if (this.dyadicArr[i][col] > 0 && this.dyadicArr[i][col] !== mj.Identification) {
                break
              } else if (this.dyadicArr[i][col] === mj.Identification && mj.visible) {
                downRow = i
                break
              }
            }
          }
          if (upRow > -1 && downRow > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            //1.0版本，自动消除较近的
            if (Math.abs(upRow - mj.row) <= Math.abs(downRow - mj.row)) {
              this.mjArr.forEach(x => {
                if (x.row === upRow && x.col === col && x.visible) {
                  x.visible = false
                  this.dyadicArr[upRow][col] = 0
                }
              })
            } else {
              this.mjArr.forEach(x => {
                if (x.row === downRow && x.col === col && x.visible) {
                  x.visible = false
                  this.dyadicArr[downRow][col] = 0
                }
              })
            }
          } else if (upRow > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            this.mjArr.forEach(x => {
              if (x.row === upRow && x.col === col && x.visible) {
                x.visible = false
                this.dyadicArr[upRow][col] = 0
              }
            })
          } else if (downRow > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            this.mjArr.forEach(x => {
              if (x.row === downRow && x.col === col && x.visible) {
                x.visible = false
                this.dyadicArr[downRow][col] = 0
              }
            })
          }
          //改变移动了的麻将的位置
          if (upRow > -1 || downRow > -1) {
            if (mj.currentMoving === 'left') {
              for (var i = mj.col - moveCounts; i < mj.col; i++) {
                this.mjArr.forEach(x => {
                  if (x.row === mj.row && x.col === i && x.visible) {
                    let temp = this.dyadicArr[x.row][i]
                    this.dyadicArr[x.row][i] = 0
                    this.dyadicArr[x.row][i - moveStep] = temp
                    x.col -= moveStep
                    x.ex_x -= x.width * 0.64 * moveStep
                    x.x = x.ex_x
                  }
                })
              }
            } else {
              for (var i = mj.col + moveCounts * 1; i > mj.col; i--) {
                this.mjArr.forEach(x => {
                  if (x.row === mj.row && x.col === i && x.visible) {
                    let temp = this.dyadicArr[x.row][i]
                    this.dyadicArr[x.row][i] = 0
                    this.dyadicArr[x.row][i + moveStep] = temp
                    x.col += moveStep
                    x.ex_x += x.width * 0.64 * moveStep
                    x.x = x.ex_x
                  }
                })
              }
            }
          }

        }
      }
      //纵向移动，横向检查
      if (mj.currentMoving === 'up' || mj.currentMoving === 'down') {
        const moveY = Math.abs(mj.y - mj.ex_y) / (mj.height * 0.9)
        const moveStep = Math.round(moveY)
        if (Math.abs(moveY - moveStep) < 0.4 && moveStep > 0) {
          let leftCol = -1, rightCol = -1
          const row = mj.currentMoving === 'up' ? mj.row - moveStep : mj.row + moveStep
          const moveCounts = mj.currentMoving === 'up' ? mj.movePath[2].up.split('_')[1] : mj.movePath[3].down.split('_')[1]
          //往左
          if (mj.col > 0) {
            for (let i = mj.col - 1; i >= 0; i--) {
              if (this.dyadicArr[row][i] > 0 && this.dyadicArr[row][i] !== mj.Identification) {
                break
              } else if (this.dyadicArr[row][i] === mj.Identification && mj.visible) {
                leftCol = i
                break
              }
            }
          }
          //往右
          if (mj.col < 17) {
            for (let i = mj.col + 1; i <= 17; i++) {
              if (this.dyadicArr[row][i] > 0 && this.dyadicArr[row][i] !== mj.Identification) {
                break
              } else if (this.dyadicArr[row][i] === mj.Identification && mj.visible) {
                rightCol = i
                break
              }
            }
          }
          if (leftCol > -1 && rightCol > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            //1.0版本，自动消除较近的
            if (Math.abs(leftCol - mj.col) >= Math.abs(rightCol - mj.col)) {
              this.mjArr.forEach(x => {
                if (x.row === row && x.col === leftCol && x.visible) {
                  x.visible = false
                  this.dyadicArr[row][leftCol] = 0
                }
              })
            } else {
              this.mjArr.forEach(x => {
                if (x.row === row && x.col === rightCol && x.visible) {
                  x.visible = false
                  this.dyadicArr[row][rightCol] = 0
                }
              })
            }
          } else if (leftCol > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            this.mjArr.forEach(x => {
              if (x.row === row && x.col === leftCol && x.visible) {
                x.visible = false
                this.dyadicArr[row][leftCol] = 0
              }
            })
          } else if (rightCol > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            this.mjArr.forEach(x => {
              if (x.row === row && x.col === rightCol && x.visible) {
                x.visible = false
                this.dyadicArr[row][rightCol] = 0
              }
            })
          }
          //改变移动了的麻将的位置
          if (leftCol > -1 || rightCol > -1) {
            if (mj.currentMoving === 'up') {
              for (var i = mj.row - moveCounts; i < mj.row; i++) {
                this.mjArr.forEach(x => {
                  if (x.row === i && x.col === mj.col && x.visible) {
                    let temp = this.dyadicArr[i][x.col]
                    this.dyadicArr[i][x.col] = 0
                    this.dyadicArr[i - moveStep][x.col] = temp
                    x.row -= moveStep
                    x.ex_y -= x.height * 0.89 * moveStep
                    x.y = x.ex_y
                  }
                })
              }
            } else {
              for (var i = mj.row + moveCounts * 1; i > mj.row; i--) {
                this.mjArr.forEach(x => {
                  if (x.row === i && x.col === mj.col && x.visible) {
                    let temp = this.dyadicArr[i][x.col]
                    this.dyadicArr[i][x.col] = 0
                    this.dyadicArr[i + moveStep][x.col] = temp
                    x.row += moveStep
                    x.ex_y += x.height * 0.89 * moveStep
                    x.y = x.ex_y
                  }
                })
              }
            }
          }

        }
      }
      this.touchmove = null

      if (!mj.visible) {
        music.eatMaJiang()
        this.score(mj.Identification)
      } else {
        music.goBack()
      }
    }
  }


  /**
   * 得分
   */
  score(val) {
    let score = this.pool.getItemByClass('score', Score)
    val = val % 9 || 9

    let time = Math.floor((Date.now() - this.startTime) / 1000);
    //1分钟内得分*100 2分钟内得分*80 3分钟内得分*70 4分钟内得分*60 5分钟内得分*50 10分钟内得分*30 15分钟内得分*10
    if (time <= 60){
      val *= 100
    } else if (time <= 120){
      val *= 80
    } else if (time <= 180) {
      val *= 70
    } else if (time <= 240) {
      val *= 60
    } else if (time <= 300) {
      val *= 50
    } else if (time <= 600) {
      val *= 30
    } else if (time <= 900) {
      val *= 10
    }
    score.init(val, window.innerWidth / 2 - 50, window.innerHeight / 2 + 30, 4)
    this.scorelist.push(score)
    this.totalScore += val 
  }

  /**
   * 回收得分，进入对象池
   * 此后不进入帧循环
   */
  removeScore(score) {
    let temp = this.score.shift()
    this.pool.recover('score', score)
  }

  /**
   * 返回当前的游戏时间
   * 
   * @returns 
   * @memberof DataBus
   */
  getCurrentTime() {
    let time = Math.floor((Date.now() - this.startTime) / 1000);
    let minute = Math.floor(time / 60)
    if (minute < 10) {
      minute = '0' + minute
    }
    let second = Math.floor(time % 60)
    if (second < 10) {
      second = '0' + second
    }
    return minute + ':' + second
  }
}