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

    this.playModel = ''
    this.doubleType = 0 //0：对战模式首页 1:创建房间/加入房间成功页
    this.keyboard = false
    this.errorInfo = ''
    this.selfImageUrl = ''
    this.selfNickName = ''
    this.rankList = []
    this.socket = null
    this.roomNumber = ''
    this.player1 = {}
    this.player2 = {}
    this.dbMjArr = []
    this.reset()
  }

  reset() {
    if (this.mjArr && this.mjArr.length > 0) {
      this.mjArr.forEach(item => { item.removeEvent() })
    }
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
    this.pauseTotalTime = 0
    this.pauseStartTime = 0
    this.gameWin = false
    this.doubleEat = false
    this.showRankList = false
    this.SaveTheScore = false
    this.myRound = true
    this.duizi = []
    this.tips = []
    this.deadGame = false
    this.confirmLeaveRoom = false
    this.playerIsLeave = false
  }

  resetDouble() {
    this.reset()
    this.player1 = {}
    this.player2 = {}
    this.dbMjArr = []
    this.doubleType = 0
    this.roomNumber = ''
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

  //更新麻将位置(触碰吃)
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
              mj.visible = false
              this.mjArr.forEach(x => {
                if (x.row === item.row && x.col === mj.col - item.step && x.visible) {
                  x.visible = false
                  if (this.playModel === 'Double') {
                    this.noticeOther({ move: 'left', step: 0, counts: 0, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification })
                  }
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
                  if (this.playModel === 'Double') {
                    this.noticeOther({ move: 'right', step: 0, counts: 0, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification })
                  }
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
                  if (this.playModel === 'Double') {
                    this.noticeOther({ move: 'up', step: 0, counts: 0, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification })
                  }
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
                  if (this.playModel === 'Double') {
                    this.noticeOther({ move: 'down', step: 0, counts: 0, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification })
                  }
                }
              })
            }
          } else if (item.disabled) {
            this.touchmove = null
            music.eatMaJiang()
            this.score(mj.Identification, this.doubleEat)
            mj.visible = false
            //这里会触发两次（相邻的触碰吃掉， 先吃一个再吃一个）
            if (this.duizi.length === 2) {
              this.duizi = []
            }
            this.duizi.push(mj)
            if (this.playModel === 'Double' && this.duizi.length === 2) {
              this.noticeOther({ move: '', step: 0, counts: 0, start: { row: this.duizi[0].row, col: this.duizi[0].col }, end: { row: this.duizi[1].row, col: this.duizi[1].col }, score: this.duizi[0].Identification })
            }
          }
        }
      })
    })
    this.change = []
  }

  //判断周围可以吃的麻将（移动吃）
  around(mj) {
    if (this.touchmove) {
      let movePath = {}
      //横向移动，纵向检查
      if (mj.currentMoving === 'left' || mj.currentMoving === 'right') {
        const moveX = Math.abs(mj.x - mj.ex_x) / (mj.width)
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
                  if (this.playModel === 'Double') {
                    movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                  }
                }
              })
            } else {
              this.mjArr.forEach(x => {
                if (x.row === downRow && x.col === col && x.visible) {
                  x.visible = false
                  this.dyadicArr[downRow][col] = 0
                  if (this.playModel === 'Double') {
                    movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                  }
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
                if (this.playModel === 'Double') {
                  movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                }
              }
            })
          } else if (downRow > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            this.mjArr.forEach(x => {
              if (x.row === downRow && x.col === col && x.visible) {
                x.visible = false
                this.dyadicArr[downRow][col] = 0
                if (this.playModel === 'Double') {
                  movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                }
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
                    x.ex_x -= x.width * moveStep
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
                    x.ex_x += x.width * moveStep
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
        const moveY = Math.abs(mj.y - mj.ex_y) / (mj.height * 0.89)
        const moveStep = Math.round(moveY)
        if (Math.abs(moveY - moveStep) < 0.3 && moveStep > 0) {
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
                  if (this.playModel === 'Double') {
                    movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                  }
                }
              })
            } else {
              this.mjArr.forEach(x => {
                if (x.row === row && x.col === rightCol && x.visible) {
                  x.visible = false
                  this.dyadicArr[row][rightCol] = 0
                  if (this.playModel === 'Double') {
                    movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                  }
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
                if (this.playModel === 'Double') {
                  movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                }
              }
            })
          } else if (rightCol > -1) {
            mj.visible = false
            this.dyadicArr[mj.row][mj.col] = 0
            this.mjArr.forEach(x => {
              if (x.row === row && x.col === rightCol && x.visible) {
                x.visible = false
                this.dyadicArr[row][rightCol] = 0
                if (this.playModel === 'Double') {
                  movePath = { move: mj.currentMoving, step: moveStep, counts: moveCounts, start: { row: mj.row, col: mj.col }, end: { row: x.row, col: x.col }, score: mj.Identification }
                }
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
        if (this.playModel === 'Double') {
          this.noticeOther(movePath)
        }
      } else {
        music.goBack()
      }
    }
  }


  noticeOther(movePath) {
    //通知对手回合
    this.socket.emit('nextround', this.roomNumber, movePath, this.dyadicArr, this.totalScore)
    this.myRound = false
    this.startTime = Date.now() + 1000

    if (!this.socket._callbacks.$myround) {// 防止重复监听
      //等待我的回合
      this.socket.on('myround', rsp => {
        if (databus.myRound) {//如果本身是自己回合，跳出
          return
        }
        this.dyadicArr = rsp.dyadicArr
        this.player2.score = rsp.totalScore
        const lag = rsp.lag || 0
        //模拟对手动作
        if (rsp.movePath) {
          if (rsp.movePath.step === 0) {//闪烁消失
            this.mjArr.forEach(mj => {
              if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                mj.blink(lag)
              } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                mj.blink(lag)
              }
            })
          } else if (rsp.movePath.counts === "0") {
            this.mjArr.forEach(mj => {
              if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                mj.moveBlink(rsp.movePath.step, rsp.movePath.move, true, lag)
              } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                setTimeout(() => { mj.blink(lag) }, 1000)
              }
            })
          } else if (rsp.movePath.counts > 0) {
            let i = 1
            while (i <= rsp.movePath.counts) {
              let row = rsp.movePath.start.row
              let col = rsp.movePath.start.col
              if (rsp.movePath.move === 'left') {
                col -= i
              } else if (rsp.movePath.move === 'right') {
                col += i
              } else if (rsp.movePath.move === 'up') {
                row -= i
              } else if (rsp.movePath.move === 'down') {
                row += i
              }
              this.mjArr.forEach(mj => {
                if (mj.visible && mj.col === col && mj.row === row) {
                  mj.moveBlink(rsp.movePath.step, rsp.movePath.move, false)
                }
              })
              i++
            }
            this.mjArr.forEach(mj => {
              if (mj.visible && mj.col === rsp.movePath.start.col && mj.row === rsp.movePath.start.row) {
                mj.moveBlink(rsp.movePath.step, rsp.movePath.move, true, lag)
              } else if (mj.visible && mj.col === rsp.movePath.end.col && mj.row === rsp.movePath.end.row) {
                setTimeout(() => { mj.blink(lag) }, 1000)
              }
            })
          }
        } else {//对手超时
          this.myRound = true
          this.startTime = Date.now() - (rsp.lag || 0)
        }

        //判断是否死局
        setTimeout(() => {
          if (this.testingGameDead()) {
            //自动洗牌
            this.totalScore += 2000 //调用单机模式接口
            this.xipaiAlive()
            //通知对方洗牌成功
            this.socket.emit('shuffleGame', this.roomNumber, this.dyadicArr)
          }
        }, 2001)
      })
    }

    //监听对方是否洗牌
    if (!this.socket._callbacks.$shuffle) {
      this.socket.on('shuffle', rsp => {
        this.dyadicArr = rsp.dyadicArr
        this.shuffle()
      })
    }
  }

  /**
   * 得分
   */
  score(val, doubleEat) {
    let score = this.pool.getItemByClass('score', Score)
    if (val >= 0) {
      val = val % 9 || 9
    }

    if (this.playModel === 'Double') {

    } else {
      let time = Math.floor((Date.now() - this.startTime - this.pauseTotalTime) / 1000);
      //1分钟内得分*100 2分钟内得分*80 3分钟内得分*70 4分钟内得分*60 5分钟内得分*50 10分钟内得分*30 15分钟内得分*10
      if (time <= 60) {
        val *= 100
      } else if (time <= 120) {
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
    }

    score.init(val, window.innerWidth / 2, window.innerHeight / 2 + 30, 4)
    this.scorelist.push(score)
    if (doubleEat === undefined) {
      this.totalScore += val
    } else {
      this.doubleEat = !doubleEat
      if (doubleEat) {
        this.totalScore += val
      }
    }
    this.player1.score = this.totalScore

    if (this.playModel === 'Single') {//单人模式每次得分后判断是否死局
      if (this.testingGameDead() && !this.gameWin) {
        this.deadGame = true
      }
    }
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
    let time = Math.floor((Date.now() - this.startTime - this.pauseTotalTime) / 1000);
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

  // 格式化时间
  timeFormat(fmt, times) {
    var time = new Date(times)
    var o = {
      "M+": time.getMonth() + 1,
      "d+": time.getDate(),
      "h+": time.getHours(),
      "m+": time.getMinutes(),
      "s+": time.getSeconds(),
      "q+": Math.floor((time.getMonth() + 3) / 3),
      "S": time.getMilliseconds()
    }
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(RegExp.$1, (time.getFullYear() + "").substr(4 - RegExp.$1.length))
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)))
    return fmt
  }

  //获取倒计时
  getCountDown() {
    let time = Math.floor(60 - (Date.now() - this.startTime) / 1000)
    if (this.myRound) {
      if (time === 0) {
        this.score(-10)
        this.noticeOther()
      } else if (time === 4) {
        music.timesUp()
      }
    }else{
      if (time === -5){//大约最多5s左右延迟,此时判定对方离开而超时
        this.overtime ++
        if (this.overtime === 3){
          this.playerIsLeave = true
        }
        this.myRound = true
        this.player2.score -= 10
        this.startTime = Date.now()
      }
    }
    return time <= 0 ? 0 : time
  }

  //死局检测
  testingGameDead() {
    this.tips = []
    for (let i = 0; i < this.dyadicArr.length; i++) {
      for (let j = 0; j < this.dyadicArr[i].length; j++) {
        if (this.dyadicArr[i][j] > 0) {
          if (!this.testingFn(i - 1, j, 'up', i, j) || !this.testingFn(i + 1, j, 'down', i, j) || !this.testingFn(i, j - 1, 'left', i, j) || !this.testingFn(i, j + 1, 'right', i, j)) {
            // console.table(this.tips)
            return false
          }
        }
      }
    }
    return true
  }

  //死局检测函数
  testingFn(row, col, direction, i, j) {
    let ob = { touch: false, firstEmpty: false, step: 0 }
    if (direction === 'up') {
      mainLoop:
      while (row >= 0) {
        let res = this.testingTouchFn(row, col, direction, i, j, ob)//检测目标在空位置的行/列有无可吃对象
        if (res === 1) {
          break mainLoop
        } else if (res === -1) {
          return false
        }
        row--
      }
      while (ob.step > 0) {//检测目标带着麻将群体移动可移动距离内的行/列有无可吃对象
        let colLeft = col - 1
        subLoop1:
        while (colLeft > 0) {
          let res = this.testingEatingFn(i - ob.step, colLeft, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop1
          }
          colLeft--
        }
        let colRight = col + 1
        subLoop2:
        while (colRight <= 17) {
          let res = this.testingEatingFn(i - ob.step, colRight, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop2
          }
          colRight++
        }
        ob.step--
      }
    } else if (direction === 'down') {
      mainLoop:
      while (row <= 5) {
        let res = this.testingTouchFn(row, col, direction, i, j, ob)//检测目标在空位置的行/列有无可吃对象
        if (res === 1) {
          break mainLoop
        } else if (res === -1) {
          return false
        }
        row++
      }
      while (ob.step > 0) {//检测目标带着麻将群体移动可移动距离内的行/列有无可吃对象
        let colLeft = col - 1
        subLoop1:
        while (colLeft > 0) {
          let res = this.testingEatingFn(i + ob.step, colLeft, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop1
          }
          colLeft--
        }
        let colRight = col + 1
        subLoop2:
        while (colRight <= 17) {
          let res = this.testingEatingFn(i + ob.step, colRight, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop2
          }
          colRight++
        }
        ob.step--
      }
    } else if (direction === 'left') {
      mainLoop:
      while (col >= 0) {
        let res = this.testingTouchFn(row, col, direction, i, j, ob)//检测目标在空位置的行/列有无可吃对象
        if (res === 1) {
          break mainLoop
        } else if (res === -1) {
          return false
        }
        col--
      }
      while (ob.step > 0) {//检测目标带着麻将群体移动可移动距离内的行/列有无可吃对象
        let rowUp = row - 1
        subLoop1:
        while (rowUp > 0) {
          let res = this.testingEatingFn(rowUp, j - ob.step, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop1
          }
          rowUp--
        }
        let rowDown = row + 1
        subLoop2:
        while (rowDown <= 5) {
          let res = this.testingEatingFn(rowDown, j - ob.step, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop2
          }
          rowDown++
        }
        ob.step--
      }
    } else if (direction === 'right') {
      mainLoop:
      while (col <= 17) {
        let res = this.testingTouchFn(row, col, direction, i, j, ob)//检测目标在空位置的行/列有无可吃对象
        if (res === 1) {
          break mainLoop
        } else if (res === -1) {
          return false
        }
        col++
      }
      while (ob.step > 0) {//检测目标带着麻将群体移动可移动距离内的行/列有无可吃对象
        let rowUp = row - 1
        subLoop1:
        while (rowUp > 0) {
          let res = this.testingEatingFn(rowUp, j + ob.step, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop1
          }
          rowUp--
        }
        let rowDown = row + 1
        subLoop2:
        while (rowDown <= 5) {
          let res = this.testingEatingFn(rowDown, j + ob.step, i, j)
          if (res === -1) {
            return false
          } else if (res === 1) {
            break subLoop2
          }
          rowDown++
        }
        ob.step--
      }
    }
    return true
  }
  //死局检测触碰逻辑
  testingTouchFn(row, col, direction, i, j, ob) {
    if (this.dyadicArr[row][col] === 0) {//该位置为空位
      if (!ob.touch) {//之前没有触碰过麻将，检测目标在该位置行/列是否有能吃掉的
        ob.firstEmpty = true//表示第一次触碰为空位
        if (direction === 'up' || direction === 'down') {
          let leftCol = col - 1
          Loop1:
          while (leftCol >= 0) {
            let res = this.testingEatingFn(row, leftCol, i, j)
            if (res === -1) {
              return res
            } else if (res === 1) {
              break Loop1
            }
            leftCol--
          }
          let rightCol = col + 1
          Loop2:
          while (rightCol <= 17) {
            let res = this.testingEatingFn(row, rightCol, i, j)
            if (res === -1) {
              return res
            } else if (res === 1) {
              break Loop2
            }
            rightCol++
          }
        } else if (direction === 'left' || direction === 'right') {
          let upRow = row - 1
          Loop1:
          while (upRow >= 0) {
            let res = this.testingEatingFn(upRow, col, i, j)
            if (res === -1) {
              return res
            } else if (res === 1) {
              break Loop1
            }
            upRow--
          }
          let downRow = row + 1
          Loop2:
          while (downRow <= 5) {
            let res = this.testingEatingFn(downRow, col, i, j)
            if (res === -1) {
              return res
            } else if (res === 1) {
              break Loop2
            }
            downRow++
          }
        }
      } else if (ob.touch && !ob.firstEmpty) {//第一次触碰就是麻将，目标可移动步数+1      
        ob.step++
      }
    } else {//该位置有麻将
      if (!ob.touch) {//之前没有触碰过其他麻将
        if (this.dyadicArr[row][col] === this.dyadicArr[i][j]) {//麻将相同，表示可以吃，没有死局
          this.tips.push({ row: i, col: j })
          this.tips.push({ row: row, col: col })
          return -1
        } else if (!ob.firstEmpty){//麻将不同，也没走过空位表示第一次触碰了麻将        
          ob.touch = true
        }else{
          return 1
        }
      } else if (ob.step > 0 || ob.firstEmpty) {//之前触碰了麻将，可移动步数大于0，表示止步于此。之前走了空位，再次触碰麻将，也止步如此。可移动步数等于0同时没有走过空位，继续执行下一循环逻辑
        return 1
      }
    }
    return 0
  }

  //死局检测吃逻辑
  testingEatingFn(row, col, i, j) {
    if (this.dyadicArr[row][col] === this.dyadicArr[i][j]) {//检测到一样的，表示可以吃，没有死局
      this.tips.push({ row: i, col: j })
      this.tips.push({ row: row, col: col })
      return -1
    } else if (this.dyadicArr[row][col] > 0) {//碰到其他麻将了，表示该行/列没有可以吃的，跳出该行/列检测
      return 1
    } else {
      return 0
    }
  }


  //重新洗牌
  xipai() {
    if (this.totalScore < 2000)
      return
    this.totalScore -= 2000
    let arr = []
    for (let i = 0; i < this.dyadicArr.length; i++) {
      for (let j = 0; j < this.dyadicArr[i].length; j++) {
        if (this.dyadicArr[i][j] > 0) {
          arr.push(this.dyadicArr[i][j])
        }
      }
    }
    for (let i = 0; i < this.dyadicArr.length; i++) {
      for (let j = 0; j < this.dyadicArr[i].length; j++) {
        if (this.dyadicArr[i][j] > 0) {
          let index = Math.floor(Math.random() * arr.length)
          this.dyadicArr[i][j] = arr[index]
          arr.splice(index, 1)
        }
      }
    }

    this.mjArr.forEach(item => {
      if (item.visible) {
        item.img.src = `images/${this.dyadicArr[item.row][item.col]}.png`
        item.Identification = this.dyadicArr[item.row][item.col]
      }
    })
  }

  //洗牌到活局
  xipaiAlive() {
    this.xipai()
    this.deadGame = false
    if (this.testingGameDead()) {
      this.totalScore += 2000 //扣除的分数加回来
      this.xipaiAlive()
    }
  }
  //对战模式洗牌
  shuffle() {
    this.mjArr.forEach(item => {
      if (item.visible) {
        item.img.src = `images/${this.dyadicArr[item.row][item.col]}.png`
        item.Identification = this.dyadicArr[item.row][item.col]
      }
    })
  }

  tip() {
    if (this.totalScore < 200)
      return
    this.totalScore -= 200
    this.myRound = false
    this.tips.forEach(item=>{
      this.mjArr.forEach(mj=>{
        if (mj.visible && item.row === mj.row && item.col === mj.col){
          mj.tips()
        }
      })
    })
  }
}