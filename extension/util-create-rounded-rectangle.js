const extensionId = Object.entries(easyeda.extension.instances).filter((e) => e[1].blobURLs && e[1].blobURLs["manifest.json"] == api("getRes", { file: "manifest.json" }))[0][1].id;
const instance = easyeda.extension.instances[extensionId];













function rectConvert(type, rect) {
    return {
        ...api('coordConvert', { type, x: rect.x, y: rect.y }),
        width: api("valConvert", { type, val: rect.width }),
        height: api("valConvert", { type, val: rect.height })
    }
}

function ensureRadius(radii, rect) {
    return radii
        .slice(0, 4)
        .map((r) => Math.max(0, Math.min(Math.min(rect.width, rect.height) / 2, r)))
}

function insertArc(center, radius, rotation, jsonCache) {
    const { x: cx, y: cy } = api("coordConvert", {
        type: "real2canvas",
        ...center,
    })
    radius = api("valConvert", { type: "real2canvas", val: radius })
    const [rx, ry] = [radius, radius]
    const rotations = [
        {
            startAngle: Math.PI * 1.5,
            endAngle: Math.PI * 1,
        },
        {
            startAngle: Math.PI * 0,
            endAngle: Math.PI * 1.5,
        },
        {
            startAngle: Math.PI * 0.5,
            endAngle: Math.PI * 0,
        },
        {
            startAngle: Math.PI * 1,
            endAngle: Math.PI * 0.5,
        },
    ]

    api("createShape", {
        shapeType: "ARC",
        jsonCache: {
            layerid: jsonCache?.layerid || 1,
            strokeWidth: api("valConvert", { type: "real2canvas", val: jsonCache.strokeWidth || "10mil" }),
            d: api("getSvgArcPathByCRA", {
                cx,
                cy,
                rx,
                ry,
                ...rotations[rotation],
            }),
        },
    })
}

function insertTrack(startPoint, endPoint, jsonCache) {
    api("createShape", {
        shapeType: "TRACK",
        jsonCache: {
            layerid: jsonCache?.layerid || 1,
            strokeWidth: api("valConvert", { type: "real2canvas", val: jsonCache.strokeWidth || "10mil" }),
            pointArr: [
                api("coordConvert", { type: "real2canvas", ...startPoint }),
                api("coordConvert", { type: "real2canvas", ...endPoint }),
            ],
        },
    })
}

function generateRoundRectSolidPath(rect, radii) {
    const { x, y, width, height} = rectConvert("real2canvas", rect)
    radii = radii.map((r) => api("valConvert", { type: "real2canvas", val: r }))
    
    let d = `M${x + radii[0]},${y}`
    d += ` L${x + width - radii[1]},${y}`
    if (radii[1] > 0) {
        d += ` A${radii[1]},${radii[1]} 0 0 1 ${x + width},${y + radii[1]}`
    }
    d += ` L${x + width},${y + height - radii[2]}`
    if (radii[2] > 0) {
        d += ` A${radii[2]},${radii[2]} 0 0 1 ${x + width - radii[2]},${y + height}`
    }
    d += ` L${x + radii[3]},${y + height}`
    if (radii[3] > 0) {
        d += ` A${radii[3]},${radii[3]} 0 0 1 ${x},${y + height - radii[3]}`
    }
    d += ` L${x},${y + radii[0]}`
    if (radii[0] > 0) {
        d += ` A${radii[0]},${radii[0]} 0 0 1 ${x + radii[0]},${y}`
    }
    d += ` Z`
    
    return d
}

function createRoundRectSolid ({ x, y, width, height}, radii, jsonCache) {
    radii = ensureRadius(radii, {width, height})

    api('createShape', {
        shapeType: "SOLIDREGION",
        jsonCache: {
            layerid: jsonCache?.layerid || 1,
            pathStr: generateRoundRectSolidPath({ x, y, width, height}, radii)
        }
    })
}

function createRoundRectTrack ({ x, y, width, height}, radii, jsonCache, strokeType = 0) {

    if (jsonCache.strokeWidth) {
        jsonCache.strokeWidth = Math.min(jsonCache.strokeWidth, Math.min(width, height) / 2)
        if (strokeType > 0) {
            const { strokeWidth: sw } = jsonCache
            //                    outside : inside
            x = strokeType > 1 ? x - sw/2 : x + sw/2
            y = strokeType > 1 ? y - sw/2 : y + sw/2
            width = strokeType > 1 ? width + sw : width - sw
            height = strokeType > 1 ? height + sw : height - sw
        }        
    }
    
    radii = ensureRadius(radii, {width, height})

    for (const [rotation, arc] of insetRectVertex({ x, y, width, height }, radii).entries()) {
        insertArc(arc.point, arc.radius, rotation, jsonCache)
    }

    for (const { startPoint, endPoint } of trimRectCorners({ x, y, width, height }, radii)) {
        insertTrack(startPoint, endPoint, jsonCache)
    }
}

function insetRectVertex({x, y, width, height}, radii) {
    return [
        {point: {x: x + radii[0], y: y + radii[0]}, radius: radii[0]},
        {point: {x: x + width - radii[1], y: y + radii[1]}, radius: radii[1]},
        {point: {x: x + width - radii[2], y: y + height - radii[2]}, radius: radii[2]},
        {point: {x: x + radii[3], y: y + height - radii[3]}, radius: radii[3]},
    ];
}

function trimRectCorners({x, y, width, height}, radii) {
    return [
        {startPoint: {x: x + radii[0], y}, endPoint: {x: x + width - radii[1], y}},
        {startPoint: {x: x + width, y: y + radii[1]}, endPoint: {x: x + width, y: y + height - radii[2]}},
        {startPoint: {x: x + width - radii[2], y: y + height}, endPoint: {x: x + radii[3], y: y + height}},
        {startPoint: {x: x, y: y + height - radii[3]}, endPoint: {x: x, y: y + radii[0]}}
    ];
}













const css = `
#roundrectdlg form { padding: 16px; display: flex; flex-direction: column; width: 100%; justify-content: space-between;}
#roundrectdlg .button { background-color: #5588ff; color: white; border-radius: 4px; height: 32px; display: flex; justify-content: center; align-items: center;}
#roundrectdlg input[type=number] { width: 60px; height: 24px; }
#roundrectdlg div[hidden] { display: none; }
#roundrectdlg input[type="checkbox"] { margin: 0 4px 0 0; }
.backup-checkbox { display: flex; align-items: center; margin-top: 8px; }
.uniform { height: 60px; }
.individual { height: 60px; display: inline-grid; grid-template-columns: 1fr 1fr; gap: 8px; }
#roundrectdlg fieldset { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin: 0; padding: 0; border: none; margin-bottom: 16px; padding-top: 8px; }
#roundrectdlg fieldset legend { font-weight: bold; width: 100%; display: flex; justify-content: space-between; }
#roundrectdlg fieldset legend span { font-weight: normal; color: gray; font-style: normal; background: black; color: white; border-radius: 4px; padding: 2px 4px; cursor: pointer;}
#roundrectdlg fieldset[disabled] { filter: saturate(0%); pointer-events: none; color: lightgray; }
#roundrectdlg fieldset[disabled] input[type=number] { color: lightgray; border-color: #eeeeee; }
#roundrectdlg input[type=number]::-webkit-inner-spin-button, #roundrectdlg input[type=number]::-webkit-outer-spin-button {appearance: none; margin: 0; }
.radio-tabs { display: inline-flex; background-color: hsl(0 0% 90% / 1); border-radius: 4px; gap: 2px; padding: 2px; }
.radio-tabs .tab { border-radius: 2px; display: flex; padding: 2px 6px; gap: 4px; align-items: flex-end; cursor: pointer;}
.radio-tabs .tab img { width: 15px; }
.radio-tabs .tab[selected] { background-color: white; }
`

const { html, render, Component } = htmPreact

const dom = Object.assign(document.createElement('div'), { style: "display: flex; height: 100%", class: "roundrect-container"}) 
const style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(css));
dom.appendChild(style);

const radiusMode = [
    { name: "Uniform", src: "data:image/webp;base64,UklGRuwAAABXRUJQVlA4TOAAAAAvHUAHEI+gqG0jyXPw/w/CZbGloahtI8lz8P8PwmWxVdS2keQ5+P8H4bLYKookqblIDl6yAjzxQihqAnB3ivb/j6hJpKoOIjYCEhARmOQn6bv73nsXjNtIUrTMdZB/uIuH74j+K3DbRmm2Y4ZPiDcgrd8yDXnzVk7cBCYEM0qdBwscZ6/GF6yvBShO7aJhV64AtJUyAFGLIToCoRnM1nTjQ6tJW1fgASemOMDXBWyAmksBW11ABva5diDXBQCIBQD+S5cGStdv4eoNXr39qy/n4qu7+GIvvvZrP+XiL3sBAg==" },
    { name: "Individual", src: "data:image/webp;base64,UklGRv4AAABXRUJQVlA4TPEAAAAvHUAHEJegqG0jycOfyZCb/7VLQ1HbRpKHP5MhN/9rV1HbRpKHP5MhN/9rV3EkSckZDj/7eSYU+adEADKTqyr+/ysy+nsv4UXEjwj+/x9YeDQgCArY3ReM20hS1MvHd7X5Z4s6+kf0X4HbNsoYj+8T+gCaMG/74iTJLfs2B9NlvwKQJCkBsPoOh5MxcIbWrvlqnaum2jRVdspWDdo8VUlTxQCiBhgBqtBcbA2xmLMkbUAeQwY2STrgsmOwF+yStMAy4v5qXEpuCO1qfoz3Su4PdPcW7t7gvdu/+3LuvrqbL/bua7/3U4a/7Gido/pl76MAAA==" }
]

const shapeMode = [
    { name: "Solid", src: "data:image/webp;base64,UklGRoIAAABXRUJQVlA4THUAAAAvHUAHED9AkG1T/UE/11CQtgFT5nH+jbz5J9OAoH8RAVTRhNcCcDI7FOJGtDDYRJItZbKvAAT8SwCFAlAADkAB/uN3RqQR/RcIEBxwQdpnr9JzBb5RtXeBq1ouME1e6CYHNJMNqu0v4IZ1s7tT3GXuUHd3VgAA" },
    { name: "Line", src: "data:image/webp;base64,UklGRpYAAABXRUJQVlA4TIoAAAAvHUAHEE+goG0bxlLZF/MODQJJG/kbvn+Xz7/ZtG2SKUfkf8hDeaFjp66FAF52PHxqcCjWSQRsItt2cuZjAjo6WkS8n3oGBWAAB8lAkvxjRRvRfwJJm9vga0G1e5bQ2gGjk9jVwC4pLfjkPjAyAACbLKBFRetlAhFiIv+w3LHZ27NRssmyQbO5awE=" }
]

const lineModes = [
    { name: "Middle", src: "data:image/webp;base64,UklGRjQBAABXRUJQVlA4TCgBAAAvHUAHEK/BKJIkRbVwfOff3b1JwUJv22AcSVKbwbxIgfwDknLBw+78O44kSY1SbKjskYP6M+MxBGAPns9PwkDAIgo9RqQ/8kabPtGQgVRyjIOFAQO+4AsqsBhpiP5IBV5BWkclWEMQIDfbn6yOttdnDEF+SZGa11891kKI3D91oEtflEUwbVEnFnUCR5Ikq8r77v8jhbu7M/c/HPFkxzai/xOg/sPDZj3f623qxaSPsZm3GmBr1Ez5rYrE15vsRkArvlxfX9EbNCMgPX3EXOdNoR09RG7nLPD1uhUQveWZl11MNfUA0ofcww7mmiW0TvIMgd5wttdrJhB/JO/AeKvsD324yK2E8VE53EB1lXOX3la5XEPxkgyGyukckq8EMHOzB1/Eh/2/Bw=="},
    { name: "Inside", src: "data:image/webp;base64,UklGRg4BAABXRUJQVlA4TAIBAAAvHUAHEMfBOJKkNoP9k39+fD3Ia9Ng20iSoj7yLv/wzrsA4Blm5t9RJNuq05+ZyQYJ/JbiIWKyigBaBCAfQABi0IAW9KAEMdjACuI59aXbsf77/e3jsgGXMPAcXIFfPL+3PtOH13PqkPKVz3vLsN9vgT7hLyFGgSRsxmZcwURsJlbupt3Z45NnHu41wDwXa6Efme/jOpCRgCPZtk3nfZuxdWPj/5z5j+2xlTQj+j8B7Nd1omw0nUlLWeniBVUZb9AA79tqJi3hz4FHr3vYkrTIHaOdnEhZlLcY7klbeMf6SPoKNBXps5fY7AwET/TJQPRBKbhcpXnxF7XgzDQmQEfA/jc="},
    { name: "Outside", src: "data:image/webp;base64,UklGRj4BAABXRUJQVlA4TDIBAAAvHUAHEJ/BoJEkRX3sXyjfPcPYYNxGkqLqzT/RfeExdM8/G9u2XRw550ynNRCVMZmaAf1a5gVAaYAS6GA6hvn9JfelParlF+4L94N4QcYIrsMt2DJkpFsZQoEfCBDhMFAGgoxYZmQwxc7LfiQwMlAI0RO+kRAMSI0VH7b8WreB78Xz4Dlx3dgb3hcK/h9wJdm26dxn4zwz1o2TM//ZvavwN6L/E0D+x2GxWm8ppVTGbHOoCqbYfF9wi+S7ulAwdoUo37IpVCzLQsXYFCrytuCM3CBOAQA4dgU79M8PnGbNa0bvnhCfl2MGAMDaF9O9d8N7YpuGRnhnBdO94dXRieiGEZ7wahHxA8PHu0PEh2oqOmOiS1gU0+7jaROJK0aAF1PGmhHj0ZCxZaSYaTIoAxDItwA="}
]

class RoundRect extends Component {
    state = {
        radius: 0,
        radii: [0, 0, 0, 0],
        radiusMode: 0,
        shapeMode: 1,
        lineMode: 0,
        lineWidth: 0,
        unit: 'mm'
    }

    componentDidMount () { 
        $(dom).on("dialog:open", () => {
            const { unit } = api('editorCall', { cmd: "canvas_config" })
            this.setState({ unit })
            if (this.state.radius === 0) {
                this.setState({
                    radius: unit === "mm" ? 2.54 : 100,
                    radii: unit === "mm" ? this.radius2radii(2.54) : this.radius2radii(100)
                })
            }
            if (this.state.lineWidth === 0) {
                this.setState({
                    lineWidth: unit === "mm" ? 0.254 : 10,
                })
            }
        })
        
        $('#attr-main').on("change", () => {
            const unit = $('#attr-main select[name="attr-pcbcanvas-unit"]').val() ==  "mil" ? "mil" : "mm";
            const convert = (value) => parseFloat(api('unitConvert', { type: unit == 'mil' ? 'mm2mil' : 'mil2mm', value }).toFixed(3))
            if (unit !== this.state.unit) {
                this.setState({
                    unit,
                    radius: convert(this.state.radius),
                    radii: [...this.state.radii].map(r => convert(r)),
                    lineWidth: convert(this.state.lineWidth)
                })
            }
        })
    }

    radius2radii = (radius) => [radius, radius, radius, radius]

    handleRadius = (e) => {
        const radius = e.currentTarget.value
        this.setState({ radius, radii: this.radius2radii(radius) });
    }
    
    handleRadii = (e) => {
        const index = e.currentTarget.getAttribute("index")
        const value = e.currentTarget.value
        const radii = [...this.state.radii]
        radii[index] = value
        this.setState({ radii })
    }
    
    handleIndividual = (mode) => {
        this.setState({ radiusMode: mode })
    }

    handleLineWidth = (e) => {
        const lineWidth = parseFloat(e.currentTarget.value)
        this.setState({ lineWidth });
    }

    handleUnit = () => {
        api('editorCall', { cmd: "changeCanvasUnit" })
    }

    handleCreate = (e) => {
        const { RECT } = api("getSource", { type: "json" })
        const selectedIds = api('getSelectedIds').split(',').filter(id => id)

        if (!selectedIds.length) {
            $.messager.show({ title: "Warning", msg: "Please select a rectangle" });
            return
        }

        
        for (const id of selectedIds) {
            if (RECT.hasOwnProperty(id)) {
                const { x, y, width, height, layerid, gId } = RECT[id]
                const rect = rectConvert("canvas2real", { x, y, width, height})
                const radii = this.state.radiusMode ? this.state.radii : this.radius2radii(this.state.radius)

                if (this.state.unit === "mil" && this.state.lineWidth < 5) this.setState({ lineWidth: 5 })
                else if (this.state.unit === "mm" && this.state.lineWidth < 0.127) this.setState({ lineWidth: 0.127 })

                api('cacheHistory')

                if (this.state.shapeMode === 0) {
                    createRoundRectSolid(rect, radii, { layerid })
                } else {
                    createRoundRectTrack(rect, radii, { layerid, strokeWidth: this.state.lineWidth }, this.state.lineMode)
                }
        
                api('delete', {
                    ids: [gId]
                });

                api('flushHistory')
            } else {
                $.messager.show({ title: "Warning", msg: "Selection contains non-rectangle" });
            }
        }
    }

    render () {
    return html`
        <form>
            <div>
                <fieldset>
                    <legend>Radius<span onClick=${this.handleUnit}>${this.state.unit}</span></legend>
                    
                    <div class="uniform" hidden=${this.state.radiusMode == 1}>
                        <input type="number" step="0.001" value=${this.state.radius} onInput=${this.handleRadius} tabindex="0"/>
                    </div>
                    
                    <div class="individual" hidden=${this.state.radiusMode == 0}>
                        ${ [...Array(4)].map((_, i) => html`<input type="number" step="0.001" value=${this.state.radii[i]} onInput=${this.handleRadii} key=${i} index=${i}/>`) }
                    </div>
                    
                    <div class="radio-tabs">
                        ${ radiusMode.map(({name, src}, i) => html`<div class="tab" selected=${this.state.radiusMode == i} onClick=${() => this.handleIndividual(i)}><img src=${src}/>${name}</div>`) }
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Type</legend>
                    <div class="radio-tabs">
                    ${ shapeMode.map(({name, src}, i) => html`
                        <div class="tab" selected=${this.state.shapeMode == i} onClick=${() => this.setState({ shapeMode: i })}><img src=${src}/>${name}</div>
                    `) }
                    </div>
                </fieldset>
                <fieldset disabled=${this.state.shapeMode == 0}>
                    <legend>Line Mode</legend>
                    <div class="radio-tabs">
                    ${ lineModes.map(({name, src}, i) => html`
                        <div class="tab" selected=${this.state.lineMode == i} onClick=${() => this.setState({ lineMode: i })}><img src=${src}/>${name}</div>
                    `) }
                    </div>
                </fieldset>
                <fieldset disabled=${this.state.shapeMode == 0}>
                    <legend>Line Width</legend>
                    <input type="number" step="0.001" value=${this.state.lineWidth} onInput=${this.handleLineWidth}/>
                </fieldset>
                <!--
                <div class="backup-checkbox">
                    <input type="checkbox" id="backup"></input>
                    <label for="backup">Backup</label>
                </div>
                //-->
            </div>
            <div class="button" onClick=${this.handleCreate}>Create</div>
      </form>`
    }
}

render(html`<${RoundRect}/>`, dom)

const roundRectDialog = api('createDialog', {
    title: "Create Rounded Rectangle",
    id: "roundrectdlg",
    content: dom,
    width: 300,
    height: 420,
    modal: false
})

instance.util_create_rounded_rectangle = () => {
    $(dom).trigger("dialog:open")
    roundRectDialog.dialog("open")
}