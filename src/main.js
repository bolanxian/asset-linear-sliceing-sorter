/**
 * @createDate 2021年10月5日, 星期二，下午 8:23:34
 */
import Vue from 'vue'
import iview from 'view-design'
import Viewer from 'viewerjs'
import Asset from './asset-bundle/asset'
import utils from './utils'

const { Mesh, xhr, loadImage, writeFile } = utils
const { generToFunc, BufferReader } = Asset.utils
class PantingExtracter {
  *xread(buf) {
    var i = 0, size = 4
    yield { i: i++, size, name: 'Bundle' }
    this.bundle = new Asset.Bundle(new BufferReader(buf))
    const assetMap = this.bundle.extract()
    for (var name of assetMap.keys()) {
      if (name.endsWith('.resS')) { continue }
      //.resS file is external data storage file
      break
    }
    yield { i: i++, size, name: 'Asset' }
    this.asset = new Asset.File(new BufferReader(assetMap.get(name)))
    this.texture = this.mesh = null
    for (const item of this.asset.preloadTable.values()) {
      const name = item.typeString
      if (name === 'Texture2D' && !this.texture) {
        yield { i: i++, size, name }
        this.texture = new Asset.Texture2D(item, assetMap)// Parse and read data
        this.imageData = this.texture.toImageData()
      } else if (name === 'Mesh' && !this.mesh) {
        yield { i: i++, size, name }
        this.mesh = new Asset.Mesh(item)
        this.meshText = this.mesh.toObj()
      }
    }
    yield { i: i++, size, name: 'complete' }
  }
}
Mesh.PantingExtracter = PantingExtracter
generToFunc(PantingExtracter.prototype, 'read')

const { LoadingBar, Row, Col, Checkbox, Button, ButtonGroup, Cell, CellGroup } = iview
const id = 'sorter'
const delay = t => new Promise(ok => { setTimeout(ok, t) })
const createProcesser = (name, cb) => {
  return async function () {
    if (this.progress) { return }
    try {
      this.progress = name
      //await delay(100)
      await cb.apply(this, arguments)
      LoadingBar.finish()
    } catch (err) {
      if (err.name === 'AbortError') {
        iview.Message.warning('已取消')
      } else {
        LoadingBar.error()
        iview.Message.error('发生错误')
        throw err
      }
    } finally {
      this.progress = null
    }
  }
}
const name = 'Asset Linear Sliceing Sorter'
const vm = new Vue({
  name,
  data() {
    return {
      progress: null,
      curMeshName: null,
      meshMap: null
    }
  },
  computed: {
    curMesh() {
      const name = this.curMeshName
      return this.meshMap && this.meshMap.get(name)
    }
  },
  methods: {
    handleDragover(e) {
      e.preventDefault(); e.stopPropagation()
    },
    handleDrop: createProcesser('drop', async function (e) {
      e.preventDefault(); e.stopPropagation()
      const vm = this, files = Array.from(e.dataTransfer.files)
      if (this.hasFSAccess) {
        for (const item of e.dataTransfer.items) {
          if (item.kind !== 'file') { continue }
          const entry = await item.getAsFileSystemHandle()
          if (entry.kind !== 'directory') { continue }
          vm.handle = entry
          var it = await Mesh.FsHandleLoader.from(vm.handle)
          break
        }
      }
      if (it == null) { it = Mesh.FileLoader.fromList(files) }
      const map = vm.meshMap = new Map()
      for await (var [key, mesh] of it.entries((stat) => {
        LoadingBar.update(100 * stat.i / stat.size)
      })) {
        map.set(key, mesh)
        var weak = mesh.pantingExtracterWeak
        if (weak) {
          vm.lastPantingExtracter = weak.deref()
        }
        if (map.size === 1) { vm.draw(key) }
        vm.$forceUpdate()
      }
    }),
    handleOpen: createProcesser('open', async function (e) {
      const vm = this, el = e && e.target
      if (el && e.type === 'change' && el.tagName === "INPUT") {
        it = Mesh.FileLoader.fromList(el.files)
      } else if (!vm.hasFSAccess) {
        const el = document.createElement('input')
        el.type = 'file'; el.multiple = true
        el.onchange = vm.handleOpen
        document.body.appendChild(el)
        el.click()
        document.body.removeChild(el)
      } else {
        const fileHandles = await showOpenFilePicker({
          id, multiple: true,
          /* types:[{
            description: 'Images & Meshs',
            accept:{
              'image/png':'.png','text/plain+mesh':'.obj',
              'text/*':'.Unity3D'
            }
          }] */
        })
        it = Mesh.FileLoader.fromList(fileHandles)
      }
      if (it) {
        var map = vm.meshMap = new Map(), it
        for await (var [key, mesh] of it.entries((stat) => {
          LoadingBar.update(100 * stat.i / stat.size)
        })) {
          map.set(key, mesh)
          var weak = mesh.pantingExtracterWeak
          if (weak) {
            vm.lastPantingExtracter = weak.deref()
          }
          if (map.size === 1) { vm.draw(key) }
          vm.$forceUpdate()
        }
      }
    }),
    handleOpenDir: createProcesser('open-dir', async function () {
      const vm = this
      vm.handle = await window.showDirectoryPicker({ id })
      const it = await Mesh.FsHandleLoader.from(vm.handle)
      const map = vm.meshMap = new Map()
      for await (var [key, value] of it.entries((stat) => {
        LoadingBar.update(100 * stat.i / stat.size)
      })) {
        map.set(key, value)
        if (map.size === 1) { vm.draw(key) }
        vm.$forceUpdate()
      }
    }),
    handleExports: createProcesser('exports', async function () {
      const vm = this, { canvas } = vm.$refs
      const blob = new Promise(ok => { canvas.toBlob(ok, 'image/png') })
      const name = vm.curMeshName + '.png'
      if (vm.hasFSAccess) {
        const handle = await showSaveFilePicker({
          id,
          types: [{
            description: 'PNG',
            accept: { 'image/png': '.png' }
          }],
          suggestedName: name
        })
        await writeFile(handle, true, await blob)
        return
      }
      const link = document.createElement('a')
      const dataURL = URL.createObjectURL(await blob)
      link.href = dataURL
      link.download = name
      link.style.display = 'none'
      document.body.append(link)
      link.click(); link.remove()
      URL.revokeObjectURL(dataURL)
    }),
    handleExportsDir: createProcesser('exports-dir', async function () {
      const vm = this, { canvas } = vm.$refs
      if (vm.handle) {
        handle = await vm.handle.getDirectoryHandle('exports', { create: true })
      } else {
        var handle = await window.showDirectoryPicker({ id })
      }
      var prev = Promise.resolve()
      var i = 0, len = vm.meshMap.size + 1
      for (var name of vm.meshMap.keys()) {
        const fileName = name + '.png'
        try {
          throw new DOMException('', 'NotFoundError')
          await handle.getFileHandle(fileName)
        } catch (err) {
          if (err.name !== 'NotFoundError') { throw err }
          vm.draw(name)
          var blob = await new Promise(ok => { canvas.toBlob(ok, 'image/png') })
          await prev
          prev = writeFile(handle, fileName, blob)
        }
        LoadingBar.update(100 * ++i / len)
      }
      await prev
    }),
    handleViewer() {
      const vm = this
      vm.$refs.canvas.toBlob(blob => {
        var src = URL.createObjectURL(blob)
        var img = new Image()
        img.src = src
        var viewer = vm.viewer = new Viewer(img, {
          hidden() {
            URL.revokeObjectURL(src)
            viewer.destroy()
            vm.viewer = null
          }
        })
        viewer.show()
      }, 'image/png')
    },
    draw(name) {
      const vm = this, { canvas } = vm.$refs
      if (typeof name === 'string') { vm.curMeshName = name }
      const mesh = vm.curMesh
      if (!mesh) { return }
      mesh.setCanvasSize(canvas)
      const ctx = canvas.getContext("2d")
      mesh.draw(ctx)
      if (vm.hasOutline) {
        mesh.drawOutline(ctx)
      }
    },
    drawDump() {
      const vm = this
      vm.curMesh.drawDump(vm.$refs.canvas)
    }
  },
  created() {
    this.hasFSAccess = 'showOpenFilePicker' in window
  },
  async mounted() {
    const vm = this, el = vm.$el, doc = el.ownerDocument
    doc.title = name
    doc.addEventListener('dragover', vm.handleDragover)
    doc.addEventListener('drop', vm.handleDrop)
    vm.$watch('hasOutline', vm.draw)
  },
  render() {
    const vm = this, { _c, _v, _e, hasFSAccess, progress, meshMap } = this
    const disabled = !!progress, hasMeshMap = meshMap && meshMap.size
    return _c('div', {
      staticClass: "container", attrs: { id: "app" }
    }, [
      _c(Row, { attrs: { gutter: 5 } }, [
        _c(Col, { attrs: { span: 4 } }, [_v(' ')]),
        _c(Col, { attrs: { span: 20 } }, [
          _c(ButtonGroup, { staticStyle: { margin: '5px' } }, [
            _c(Button, {
              attrs: { disabled },
              on: { click: vm.handleOpen }
            }, [_v('打开')]),
            _c(Button, {
              attrs: { disabled: !hasFSAccess || disabled },
              on: { click: vm.handleOpenDir }
            }, [_v('打开文件夹')]),
            _c(Button, {
              attrs: { disabled: disabled || !hasMeshMap },
              on: { click: vm.handleExports }
            }, [_v('导出')]),
            _c(Button, {
              attrs: { disabled: !hasFSAccess || disabled || !hasMeshMap },
              on: { click: vm.handleExportsDir },
            }, [_v('批量导出')])
          ]),
          _c(Checkbox, { ref: 'hasOutline' }, [_v('显示轮廓')])
        ])
      ]),
      _c(Row, { attrs: { gutter: 5 } }, [
        _c(Col, {
          attrs: { span: 4 },
        }, [
          _c(CellGroup, {
            staticStyle: {
              'min-height': '100%',
              border: '5px solid #adadad',
              'border-bottom': 0
            },
            on: { 'on-click': vm.draw },
          }, vm.meshMap ? Array.from(vm.meshMap.keys(), (name) => {
            return _c(Cell, {
              attrs: {
                name, title: name, disabled,
                selected: vm.curMeshName === name
              }
            })
          }) : [])
        ]),
        _c(Col, { attrs: { span: 20 }, }, [
          _c('canvas', {
            ref: 'canvas',
            staticClass: 'transparent',
            staticStyle: {
              'text-align': 'center',
              margin: 'auto',
              'width': '100%',
              //'max-height':'100%',
              border: '5px solid #adadad',
            },
            on: { click: vm.handleViewer }
          })
        ])
      ]),
    ])
  }
})
var def = (vm, key) => {
  Object.defineProperty(vm, key, {
    enumerable: true,
    configurable: true,
    get() { return this.$refs[key].currentValue },
    set(value) { this.$refs[key].currentValue = value }
  })
}
def(vm, 'hasOutline')
try {
  vm.$mount('#app')
  Object.assign(vm, {
    utils, Asset
  })
  Object.assign(window, {
    Vue, iview, Viewer, vm
  })
} catch (e) {
  var el = document.getElementById('nuxt-loading')
  if (el) { el.classList.add('error') }
  throw e
}
