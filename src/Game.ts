import * as PIXI from 'pixi.js'

const REELS = 5
const ROWS = 3

// Symbols are larger images, but we show them smaller in the reel
const SYMBOL_SIZE = 96

const PAY: Record<string, number> = {
    A: 20,
    K: 15,
    Q: 10,
    J: 8,
    '10': 6,
    '9': 5,

    H1: 25,
    H2: 25,
    H3: 30,
    H4: 30,
    H5: 40,
    H6: 40,

    M1: 50,
    M2: 50,
    M3: 60,
    M4: 60,
    M5: 80,
    M6: 100
}

// load all textures once
const SYMBOL_TEXTURES: Record<string, PIXI.Texture> = {
    '9': PIXI.Texture.from('/assets/symbols/9.png'),
    '10': PIXI.Texture.from('/assets/symbols/10.png'),
    A: PIXI.Texture.from('/assets/symbols/A.png'),
    BONUS: PIXI.Texture.from('/assets/symbols/BONUS.png'),
    J: PIXI.Texture.from('/assets/symbols/J.png'),
    Q: PIXI.Texture.from('/assets/symbols/Q.png'),
    K: PIXI.Texture.from('/assets/symbols/K.png'),

    H1: PIXI.Texture.from('/assets/symbols/H1.png'),
    H2: PIXI.Texture.from('/assets/symbols/H2.png'),
    H3: PIXI.Texture.from('/assets/symbols/H3.png'),
    H4: PIXI.Texture.from('/assets/symbols/H4.png'),
    H5: PIXI.Texture.from('/assets/symbols/H5.png'),
    H6: PIXI.Texture.from('/assets/symbols/H6.png'),

    M1: PIXI.Texture.from('/assets/symbols/M1.png'),
    M2: PIXI.Texture.from('/assets/symbols/M2.png'),
    M3: PIXI.Texture.from('/assets/symbols/M3.png'),
    M4: PIXI.Texture.from('/assets/symbols/M4.png'),
    M5: PIXI.Texture.from('/assets/symbols/M5.png'),
    M6: PIXI.Texture.from('/assets/symbols/M6.png')
}

// simple reel strips, not weighted too aggressively
const REEL_STRIPS: string[][] = [
    ['A', 'K', 'Q', 'J', '10', '9', 'H1', 'Q', 'M1', 'A', 'K', 'Q', 'J', '9', 'M2', 'Q', 'K', 'A'],
    ['Q', 'J', 'K', '10', '9', 'A', 'H2', 'J', 'M2', 'A', 'Q', 'K', '9', '10', 'H3', 'K', 'Q'],
    ['A', 'Q', 'K', 'H4', 'J', 'Q', 'A', 'M3', '10', '9', 'K', 'Q', 'J', 'A', 'M4'],
    ['K', 'Q', 'A', 'J', 'H5', 'K', 'Q', 'A', 'M5', '10', '9', 'Q', 'J', 'A'],
    ['Q', 'A', 'K', 'J', 'H6', 'A', 'M6', 'Q', 'K', '10', '9', 'A', 'J']
]

export function setupGame(update: (state: any) => void) {
    const app = new PIXI.Application({
        resizeTo: window,
        backgroundAlpha: 0
    })

    document.getElementById('game')!.appendChild(app.view as any)

    const root = new PIXI.Container()
    app.stage.addChild(root)

    let balance = 1000
    let spinning = false

    // visible window mask (3 rows)
    const mask = new PIXI.Graphics()
        .beginFill(0xffffff)
        .drawRect(
            -REELS * SYMBOL_SIZE / 2,
            -ROWS * SYMBOL_SIZE / 2,
            REELS * SYMBOL_SIZE,
            ROWS * SYMBOL_SIZE
        )
        .endFill()

    root.addChild(mask)

    const reels = REEL_STRIPS.map((strip, reelIndex) => {
        const container = new PIXI.Container()
        container.x = -REELS * SYMBOL_SIZE / 2 + reelIndex * SYMBOL_SIZE
        container.y = -ROWS * SYMBOL_SIZE / 2
        container.mask = mask
        root.addChild(container)

        const symbols: PIXI.Sprite[] = []

        for (let i = 0; i < strip.length * 3; i++) {
            const symbolKey = strip[i % strip.length]
            const sprite = new PIXI.Sprite(SYMBOL_TEXTURES[symbolKey])

            sprite.anchor.set(0.5)
            sprite.x = SYMBOL_SIZE / 2
            sprite.y = i * SYMBOL_SIZE + SYMBOL_SIZE / 2
            sprite.width = SYMBOL_SIZE
            sprite.height = SYMBOL_SIZE

            container.addChild(sprite)
            symbols.push(sprite)
        }

        return {
            container,
            strip,
            symbols,
            pos: 0,
            stop: 0
        }
    })

    function layout() {
        root.x = app.renderer.width / 2
        root.y = app.renderer.height / 2
    }

    window.addEventListener('resize', layout)
    layout()

    function evaluate() {

        let win = 0
        const winPositions: { r: number; row: number }[] = []

        const grid = reels.map(r =>
            Array.from({ length: ROWS }, (_, i) => r.strip[(r.stop + i) % r.strip.length])
        )

        for (const symbol of Object.keys(PAY)) {
            let count = 0

            for (let r = 0; r < REELS; r++) {
                if (grid[r].includes(symbol)) count++
                else break
            }

            if (count >= 3) {
                win += PAY[symbol] * count

                for (let r = 0; r < count; r++) {
                    for (let row = 0; row < ROWS; row++) {
                        if (grid[r][row] === symbol) {
                            winPositions.push({ r, row })
                        }
                    }
                }
            }
        }

        balance += win
        update({ balance, win })

        // small pulse animation on winning symbols
        winPositions.forEach(({ r, row }) => {
            const sprite = reels[r].symbols[reels[r].stop + row]
            let t = 0

            const pulse = () => {
                t += 0.2
                sprite.scale.set(0.48 + Math.sin(t) * 0.25)

                if (t > Math.PI * 2) {
                    sprite.scale.set(0.48)
                    app.ticker.remove(pulse)
                }
            }

            app.ticker.add(pulse)
        })
    }

    function spin() {
        if (spinning) return

        spinning = true
        update({ spinning: true })

        reels.forEach(r => {
            r.stop = Math.floor(Math.random() * r.strip.length)
        })

        let completed = 0

        reels.forEach((reel, index) => {
            let speed = 70 + index * 6
            const reelHeight = reel.strip.length * SYMBOL_SIZE

            const updateReel = () => {
                reel.pos += speed
                reel.container.y = -ROWS * SYMBOL_SIZE / 2 - (reel.pos % reelHeight)

                speed *= 0.97
                if (speed < 1) reel.pos += 10

                if (speed < 0.6) {
                    reel.pos = reel.stop * SYMBOL_SIZE
                    reel.container.y = -ROWS * SYMBOL_SIZE / 2 - reel.pos
                    app.ticker.remove(updateReel)

                    if (++completed === REELS) {
                        spinning = false
                        update({ spinning: false })
                        evaluate()
                    }
                }
            }

            app.ticker.add(updateReel)
        })
    }

    ; (window as any).spin = spin
}